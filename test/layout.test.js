import assert from 'node:assert/strict';
import test from 'node:test';
import { compactTreeLayout, fitTree } from '../src/layout/compact-tree.ts';
import { pageGeometry } from '../src/model/page.ts';
import { fictionalFiveGenerationTree } from '../src/model/tree.ts';

const page = pageGeometry({
  paperSize: 'A3',
  orientation: 'landscape',
  customWidth: 297,
  customHeight: 420,
  margins: { top: 12, right: 12, bottom: 12, left: 12 },
  bleed: 0,
});

test('creates the fictional 146-person five-generation evaluation tree', () => {
  const people = fictionalFiveGenerationTree();
  assert.equal(people.length, 146);
  assert.equal(new Set(people.map((person) => person.id)).size, 146);

  const layout = compactTreeLayout(people);
  assert.equal(layout.boxes.length, 146);
  assert.equal(Math.max(...layout.boxes.map((box) => box.generation)), 4);
});

test('fits the sample deterministically inside the A3 safe area', () => {
  const layout = compactTreeLayout(fictionalFiveGenerationTree());
  const first = fitTree(layout, page.safe, page.safe);
  const second = fitTree(layout, page.safe, page.safe);

  assert.deepEqual(second, first);
  assert.ok(first.fontSize >= 2, `expected readable type, received ${first.fontSize}`);
  for (const box of layout.boxes) {
    assert.ok(first.x + box.x * first.scale >= page.safe.x - 1e-9);
    assert.ok(first.y + box.y * first.scale >= page.safe.y - 1e-9);
    assert.ok(first.x + (box.x + box.width) * first.scale <= page.safe.x + page.safe.width + 1e-9);
    assert.ok(first.y + (box.y + box.height) * first.scale <= page.safe.y + page.safe.height + 1e-9);
  }
});
