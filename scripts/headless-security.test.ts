import test from 'node:test';
import assert from 'node:assert/strict';
import { ConfirmationService } from '../src/utils/confirmation-service';

const approval = {
  operation: 'Run bash command',
  filename: 'echo test',
  content: 'echo test',
  showVSCodeOpen: false,
};

test('headless mode rejects an unapproved shell action immediately', async () => {
  const service = ConfirmationService.getInstance();
  service.resetSession();
  service.setNonInteractiveMode(true);
  const answer = await service.requestConfirmation(approval, 'bash');
  assert.equal(answer.confirmed, false);
  assert.match(answer.feedback ?? '', /denied by default/i);
  assert.equal(service.isPending(), false);
  service.resetSession();
});

test('explicit allOperations opt-in permits an action for that session', async () => {
  const service = ConfirmationService.getInstance();
  service.resetSession();
  service.setNonInteractiveMode(true);
  service.setSessionFlag('allOperations', true);
  const answer = await service.requestConfirmation(approval, 'bash');
  assert.equal(answer.confirmed, true);
  service.resetSession();
});

test('resetSession clears the approval override', async () => {
  const service = ConfirmationService.getInstance();
  service.resetSession();
  service.setSessionFlag('allOperations', true);
  service.resetSession();
  service.setNonInteractiveMode(true);
  const answer = await service.requestConfirmation(approval, 'file');
  assert.equal(answer.confirmed, false);
  service.resetSession();
});
