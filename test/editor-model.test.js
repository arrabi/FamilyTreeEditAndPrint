import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cloneTree,
  connectorPath,
  EditorHistory,
  movementIds,
  snapTranslation,
  translatePeople,
  worldPoint,
} from '../src/editor/model.ts';

const people = [
  { id: 'a', name: 'A', detail: '', x: 10, y: 10, parentIds: [], partnerId: 'b' },
  { id: 'b', name: 'B', detail: '', x: 150, y: 10, parentIds: [], partnerId: 'a' },
  { id: 'c', name: 'C', detail: '', x: 40, y: 100, parentIds: ['a', 'b'] },
  { id: 'd', name: 'D', detail: '', x: 40, y: 200, parentIds: ['c'] },
  { id: 'other', name: 'Other', detail: '', x: 500, y: 500, parentIds: [] },
];

test('couple movement includes the selected person and partner', () => {
  assert.deepEqual(
    [...movementIds(people, new Set(['a']), 'couple')].sort(),
    ['a', 'b'],
  );
  assert.deepEqual([...movementIds(people, new Set(['a']), 'person')], ['a']);
});

test('branch movement includes all descendants while preserving relationships', () => {
  const movedIds = movementIds(people, new Set(['a']), 'branch');
  const moved = translatePeople(people, movedIds, 25, -10);

  assert.deepEqual([...movedIds].sort(), ['a', 'b', 'c', 'd']);
  assert.equal(moved.find((person) => person.id === 'd')?.x, 65);
  assert.deepEqual(moved.find((person) => person.id === 'd')?.parentIds, ['c']);
  assert.equal(moved.find((person) => person.id === 'other')?.x, 500);
});

test('connector routing follows the current positions without changing graph edges', () => {
  const moved = translatePeople(people, new Set(['c']), 30, 20);
  const parent = moved.find((person) => person.id === 'a');
  const child = moved.find((person) => person.id === 'c');

  assert.equal(connectorPath(parent, child), 'M 71 62 V 91 H 131 V 120');
  assert.deepEqual(child.parentIds, ['a', 'b']);
});

test('snapping aligns a moving selection to another person and returns a guide', () => {
  const result = snapTranslation(people, new Set(['a']), 488, 492);

  assert.equal(result.dx, 490);
  assert.equal(result.dy, 490);
  assert.deepEqual(result.guides, [
    { axis: 'x', value: 561 },
    { axis: 'y', value: 526 },
  ]);
});

test('undo and redo restore independent snapshots and new edits clear redo', () => {
  const initial = { width: 800, height: 600, people: people.map((person) => ({ ...person, parentIds: [...person.parentIds] })) };
  const history = new EditorHistory(initial);
  const moved = cloneTree(initial);
  moved.people[0].x = 99;
  history.push(moved);

  assert.equal(history.undo()?.people[0]?.x, 10);
  assert.equal(history.redo()?.people[0]?.x, 99);
  history.undo();
  const newMove = cloneTree(initial);
  newMove.people[0].y = 77;
  history.push(newMove);
  assert.equal(history.canRedo, false);
  assert.equal(history.undo()?.people[0]?.y, 10);
});

test('world coordinates account for pan and zoom', () => {
  assert.deepEqual(
    worldPoint(230, 160, { left: 10, top: 20 }, { x: 20, y: 40 }, 2),
    { x: 100, y: 50 },
  );
});
