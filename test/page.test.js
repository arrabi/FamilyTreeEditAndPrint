import assert from 'node:assert/strict';
import test from 'node:test';
import { pageGeometry } from '../src/model/page.ts';

const baseSettings = {
  paperSize: 'A3',
  orientation: 'landscape',
  customWidth: 300,
  customHeight: 400,
  margins: { top: 12, right: 14, bottom: 16, left: 18 },
  bleed: 0,
};

test('uses exact standard paper dimensions and orientation', () => {
  assert.equal(pageGeometry(baseSettings).trimWidth, 420);
  assert.equal(pageGeometry(baseSettings).trimHeight, 297);

  const portrait = pageGeometry({ ...baseSettings, orientation: 'portrait' });
  assert.equal(portrait.trimWidth, 297);
  assert.equal(portrait.trimHeight, 420);
});

test('keeps trim, bleed, and safe content areas distinct', () => {
  const geometry = pageGeometry({ ...baseSettings, bleed: 3 });
  assert.deepEqual(geometry.trim, { x: 3, y: 3, width: 420, height: 297 });
  assert.deepEqual(geometry.safe, { x: 21, y: 15, width: 388, height: 269 });
  assert.equal(geometry.width, 426);
  assert.equal(geometry.height, 303);
});

test('supports exact custom sizes and rejects invalid printable areas', () => {
  const custom = pageGeometry({ ...baseSettings, paperSize: 'Custom' });
  assert.equal(custom.trimWidth, 400);
  assert.equal(custom.trimHeight, 300);
  assert.throws(
    () => pageGeometry({ ...baseSettings, margins: { top: 200, right: 0, bottom: 200, left: 0 } }),
    /positive safe area/,
  );
  assert.throws(
    () => pageGeometry({ ...baseSettings, bleed: -1 }),
    /positive safe area/,
  );
});
