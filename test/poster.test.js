import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getPosterPeople,
  renderPosterSvg,
  setBranchHidden,
  setDisplayText,
  setPersonHidden,
} from '../src/poster.ts';

const people = [
  { id: 'root', sourceName: 'Root Name' },
  { id: 'child', sourceName: 'Child Name', parentId: 'root' },
  { id: 'grandchild', sourceName: 'Grandchild Name', parentId: 'child' },
  { id: 'other', sourceName: 'Other Name', parentId: 'root' },
];

test('hides and shows a person without changing imported data', () => {
  const project = { people, presentation: {} };
  const hidden = setPersonHidden(project, 'child', true);
  const shown = setPersonHidden(hidden, 'child', false);

  assert.deepEqual(hidden.people, people);
  assert.deepEqual(getPosterPeople(hidden).map(({ id }) => id), ['root', 'grandchild', 'other']);
  assert.deepEqual(getPosterPeople(shown).map(({ id }) => id), ['root', 'child', 'grandchild', 'other']);
});

test('hides and restores an entire branch', () => {
  const project = { people, presentation: {} };
  const hidden = setBranchHidden(project, 'child', true);
  const shown = setBranchHidden(hidden, 'child', false);

  assert.deepEqual(getPosterPeople(hidden).map(({ id }) => id), ['root', 'other']);
  assert.deepEqual(getPosterPeople(shown).map(({ id }) => id), ['root', 'child', 'grandchild', 'other']);
});

test('keeps display overrides separate and uses them in exported SVG', () => {
  const project = setDisplayText({ people, presentation: {} }, 'child', 'Short name');
  const svg = renderPosterSvg(setBranchHidden(project, 'other', true));

  assert.equal(project.people[1].sourceName, 'Child Name');
  assert.equal(project.presentation.child.displayText, 'Short name');
  assert.match(svg, /Short name/);
  assert.doesNotMatch(svg, /Child Name/);
  assert.doesNotMatch(svg, /Other Name/);
  assert.doesNotMatch(svg, /\+\d+ more/);
});

test('blank display text restores the imported name', () => {
  const overridden = setDisplayText({ people, presentation: {} }, 'child', 'Short name');
  const restored = setDisplayText(overridden, 'child', '   ');

  assert.equal(restored.presentation.child.displayText, undefined);
  assert.equal(getPosterPeople(restored).find(({ id }) => id === 'child').displayText, 'Child Name');
});
