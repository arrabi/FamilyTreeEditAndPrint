import assert from 'node:assert/strict';
import test from 'node:test';
import { showScreen } from '../src/screen.ts';

test('switches between setup and editor without showing both', () => {
  const setup = { hidden: false };
  const editor = { hidden: true };

  showScreen('editor', setup, editor);
  assert.equal(setup.hidden, true);
  assert.equal(editor.hidden, false);

  showScreen('setup', setup, editor);
  assert.equal(setup.hidden, false);
  assert.equal(editor.hidden, true);
});
