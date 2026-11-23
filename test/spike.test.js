import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { exportPdf } from '../src/pdf-export.ts';
import {
  A3_LANDSCAPE,
  canvasToPoints,
  createSpikeTexts,
  spikeTexts,
  visualWordRuns,
} from '../src/spike-model.ts';

test('spike fixture covers Arabic, English, and mixed bidi names', () => {
  const texts = createSpikeTexts();
  assert.match(texts[0].text, /[\u0600-\u06ff]/u);
  assert.match(texts[1].text, /[A-Za-z]/u);
  assert.match(texts[2].text, /[\u0600-\u06ff].*[A-Za-z].*[\u0600-\u06ff]/u);
  assert.deepEqual(texts.map(({ id }) => id), ['arabic', 'english', 'mixed']);
  assert.deepEqual(
    visualWordRuns(texts[2].text, texts[2].direction),
    ['Hartwell', 'أحمد', '—', 'Noor', 'ليلى'],
  );

  texts[0].x = 0;
  assert.notEqual(texts[0].x, spikeTexts[0].x, 'fixtures remain independent between canvases');
});

test('canvas coordinates map to exact A3 landscape page dimensions', () => {
  assert.equal(A3_LANDSCAPE.widthMm, 420);
  assert.equal(A3_LANDSCAPE.heightMm, 297);
  assert.ok(Math.abs(canvasToPoints(560) - A3_LANDSCAPE.widthPoints) < 1e-9);
  assert.ok(Math.abs(A3_LANDSCAPE.widthPoints - 1190.551181102362) < 1e-9);
  assert.ok(Math.abs(A3_LANDSCAPE.heightPoints - 841.8897637795276) < 1e-9);
});

test('PDF export contains an exact A3 media box and embedded Unicode font', async () => {
  const font = await fs.readFile(new URL('../public/fonts/NotoNaskhArabic-Regular.ttf', import.meta.url));
  const pdf = await exportPdf(createSpikeTexts(), font);
  const bytes = Buffer.from(await pdf.arrayBuffer());
  const source = bytes.toString('latin1');
  const width = A3_LANDSCAPE.widthPoints.toFixed(6);
  const height = A3_LANDSCAPE.heightPoints.toFixed(6);

  assert.match(source, new RegExp(`/MediaBox \\[0 0 ${width} ${height}\\]`));
  assert.match(source, /\/FontName \/[\w+]+NotoNaskhArabic/);
  assert.match(source, /\/ToUnicode /);
  assert.match(source, /^%PDF-/);
});
