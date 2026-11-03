#!/usr/bin/env node
// Offline, read-only auditor for authorized Okta System Log exports.
// No network calls, token handling, or raw actor/IP output.
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IMPORTANT_EVENTS = Object.freeze({
  'user.account.privilege.grant': 'admin_privilege_granted',
  'user.mfa.factor.reset_all': 'mfa_reset_all',
  'user.mfa.factor.deactivate': 'mfa_factor_deactivated',
  'security.request.blocked': 'blocked_request',
  'user.account.report_suspicious_activity_by_enduser': 'user_reported_suspicious_activity',
});

function actorFingerprint(actor) {
  const id = actor?.id ?? actor?.alternateId ?? 'unknown';
  return createHash('sha256').update(String(id)).digest('hex').slice(0, 12);
}

export function parseEvents(text) {
  const raw = text.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const events = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.events) ? parsed.events : [parsed]);
    if (!events.every(e => e && typeof e === 'object' && !Array.isArray(e))) {
      throw new Error('Expected Okta event objects');
    }
    return events;
  } catch (error) {
    if (!raw.includes('\n')) throw new Error('Expected JSON array, event object, or NDJSON export');
    return raw.split(/\r?\n/).filter(Boolean).map((line, index) => {
      try {
        const event = JSON.parse(line);
        if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Invalid event');
        return event;
      } catch {
        throw new Error('Invalid NDJSON event on line ' + (index + 1));
      }
    });
  }
}

export function analyzeEvents(events, threshold = 5) {
  if (!Array.isArray(events) || !Number.isInteger(threshold) || threshold < 1) {
    throw new TypeError('Expected events array and a positive integer threshold');
  }
  const alerts = [];
  const failures = new Map();
  let failedAuthentications = 0;

  for (const event of events) {
    if (!event || typeof event !== 'object') continue;
    const type = event.eventType;
    if (Object.hasOwn(IMPORTANT_EVENTS, type)) {
      alerts.push({
        category: IMPORTANT_EVENTS[type],
        eventTime: /^\d{4}-\d{2}-\d{2}T/.test(event.published ?? '') ? event.published : null,
        actor: actorFingerprint(event.actor),
      });
    }
    if (
      (type === 'user.session.start' || type === 'user.authentication.sso') &&
      event.outcome?.result === 'FAILURE'
    ) {
      failedAuthentications++;
      const time = Date.parse(event.published ?? '');
      const windowUTC = Number.isFinite(time)
        ? new Date(Math.floor(time / 3600000) * 3600000).toISOString()
        : 'unknown';
      const actor = actorFingerprint(event.actor);
      const key = actor + ':' + windowUTC;
      const current = failures.get(key) ?? { actor, windowUTC, count: 0 };
      current.count++;
      failures.set(key, current);
    }
  }

  for (const item of failures.values()) {
    if (item.count >= threshold) {
      alerts.push({ category: 'repeated_failed_authentication', ...item });
    }
  }

  alerts.sort((a, b) => a.category.localeCompare(b.category));
  return {
    totalEvents: events.length,
    failedAuthentications,
    thresholdPerActorPerHour: threshold,
    alertCount: alerts.length,
    alerts,
    disclaimer: 'Heuristic findings; investigate in your authorized Okta tenant. No breach is inferred.',
  };
}

function main() {
  const input = process.argv[2];
  if (!input || input.startsWith('-') || process.argv.length !== 3) {
    console.error('Usage: npm run security:okta -- <authorized-okta-logs.json|.ndjson>');
    process.exitCode = 2;
    return;
  }
  try {
    const pathname = resolve(input);
    if (statSync(pathname).size > 50 * 1024 * 1024) {
      throw new Error('Log export exceeds 50 MiB limit; split the export before analysis');
    }
    const report = analyzeEvents(parseEvents(readFileSync(pathname, 'utf8')));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.alertCount > 0 ? 1 : 0;
  } catch (error) {
    console.error('Audit failed: ' + error.message);
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
