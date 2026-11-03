import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEvents, analyzeEvents } from './okta-log-audit.mjs';

const event = (eventType, result = 'SUCCESS', actor = 'internal-user') => ({
  eventType,
  outcome: { result },
  actor: { id: actor, alternateId: 'private@example.com' },
  client: { ipAddress: '203.0.113.5' },
  published: '2026-11-03T10:23:00.000Z',
});

test('parses both JSON arrays and NDJSON without network', () => {
  assert.equal(parseEvents(JSON.stringify([event('user.session.start')])).length, 1);
  assert.equal(parseEvents(JSON.stringify(event('user.session.start')) + '\n' +
    JSON.stringify(event('user.session.start'))).length, 2);
});

test('reports MFA and privileged changes but does not expose identity or IP', () => {
  const report = analyzeEvents([
    event('user.account.privilege.grant'),
    event('user.mfa.factor.reset_all'),
  ]);
  assert.equal(report.alertCount, 2);
  assert.match(JSON.stringify(report), /admin_privilege_granted/);
  assert.doesNotMatch(JSON.stringify(report), /private@example.com|203\.0\.113\.5|internal-user/);
});

test('flags five failed auth attempts in a UTC hour', () => {
  const report = analyzeEvents(Array.from({ length: 5 }, () => event('user.session.start', 'FAILURE')));
  assert.equal(report.failedAuthentications, 5);
  assert.equal(report.alerts.filter(a => a.category === 'repeated_failed_authentication').length, 1);
});

test('does not claim a breach for a clean export', () => {
  const report = analyzeEvents([event('user.session.start')]);
  assert.equal(report.alertCount, 0);
  assert.match(report.disclaimer, /No breach is inferred/);
});

test('rejects invalid input', () => {
  assert.throws(() => parseEvents('not a log'));
  assert.throws(() => parseEvents('{"eventType":"x"}\ninvalid'));
});
