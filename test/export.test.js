import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { getOutputPageSize, getPageSize, visiblePeople } from '../src/export/model.ts';
import { pixelsForMm, setPngResolution } from '../src/export/png.ts';
import { renderPdf, shapedTextRuns } from '../src/export/pdf.ts';
import { fictionalPoster } from '../src/export/sample.ts';
import { renderSvg } from '../src/export/svg.ts';

test('A3 landscape has exact trim and bleed dimensions', () => {
  assert.deepEqual(getPageSize(fictionalPoster.page), { widthMm: 420, heightMm: 297 });
  assert.deepEqual(getOutputPageSize(fictionalPoster.page), { widthMm: 426, heightMm: 303 });
  assert.equal(pixelsForMm(426, 300), 5031);
  assert.equal(pixelsForMm(303, 300), 3579);
});

test('SVG excludes hidden content and uses display overrides with RTL text', () => {
  const svg = renderSvg(fictionalPoster, [
    { family: 'Embedded Naskh', dataUrl: 'data:font/woff2;base64,AA==' },
  ]);

  assert.match(svg, /width="426mm" height="303mm"/);
  assert.match(svg, /مريم Haddad/);
  assert.doesNotMatch(svg, /Salim Haddad|Hidden fictional person/);
  assert.match(svg, /direction="rtl" unicode-bidi="plaintext"/);
  assert.match(svg, /data:font\/woff2/);
  assert.match(svg, /data-crop-marks="true"/);
  assert.match(svg, /M 363 142 C/);
});

test('visibility follows a hidden person or whole hidden branch', () => {
  const document = structuredClone(fictionalPoster);
  document.people.find((person) => person.id === 'sami').hiddenBranch = true;
  assert.deepEqual(
    visiblePeople(document).map((person) => person.id),
    ['root', 'mariam'],
  );
  document.people.find((person) => person.id === 'sami').hiddenBranch = false;
  document.people.find((person) => person.id === 'sami').hidden = true;
  assert.deepEqual(
    visiblePeople(document).map((person) => person.id),
    ['root', 'mariam', 'nadia'],
  );
});

test('mixed-script text retains separate shaped RTL and Latin runs', () => {
  assert.deepEqual(shapedTextRuns('مريم Haddad', 'rtl'), [
    { text: 'Haddad', direction: 'ltr' },
    { text: 'مريم ', direction: 'rtl' },
  ]);
  assert.deepEqual(shapedTextRuns('علي، سالم', 'rtl'), [{ text: 'علي، سالم', direction: 'rtl' }]);
  assert.deepEqual(shapedTextRuns('(علي)', 'rtl'), [
    { text: '(', direction: 'ltr' },
    { text: 'علي', direction: 'rtl' },
    { text: ')', direction: 'ltr' },
  ]);
});

test('PNG chunks record the requested physical DPI', async () => {
  const onePixelPng = Uint8Array.from(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  const result = new Uint8Array(
    await (await setPngResolution(new Blob([onePixelPng], { type: 'image/png' }), 300)).arrayBuffer(),
  );
  const marker = new TextDecoder().decode(result).indexOf('pHYs');
  assert.notEqual(marker, -1);
  assert.ok(marker < new TextDecoder().decode(result).indexOf('IDAT'));
  const values = new DataView(result.buffer, result.byteOffset + marker + 4);
  assert.equal(values.getUint32(0), 11811);
  assert.equal(values.getUint32(4), 11811);
  assert.equal(result[marker + 12], 1);
});

test('PDF uses exact page and trim boxes and embeds fonts', async () => {
  const fontDirectory = 'node_modules/@fontsource/noto-naskh-arabic/files/';
  const fonts = {
    arabic: new Uint8Array(await readFile(`${fontDirectory}noto-naskh-arabic-arabic-400-normal.woff2`)),
    latin: new Uint8Array(await readFile(`${fontDirectory}noto-naskh-arabic-latin-400-normal.woff2`)),
  };
  const document = structuredClone(fictionalPoster);
  document.freeText[0].color = '#ff0000';
  const bytes = await renderPdf(document, fonts);
  const pdf = await PDFDocument.load(bytes);
  const page = pdf.getPage(0);
  const pointsPerMm = 72 / 25.4;

  assert.ok(Math.abs(page.getWidth() - 426 * pointsPerMm) < 0.001);
  assert.ok(Math.abs(page.getHeight() - 303 * pointsPerMm) < 0.001);
  assert.ok(Math.abs(page.getTrimBox().width - 420 * pointsPerMm) < 0.001);
  assert.ok(Math.abs(page.getTrimBox().height - 297 * pointsPerMm) < 0.001);
  const rawPdf = new TextDecoder('latin1').decode(bytes);
  assert.match(rawPdf, /\/FontFile2/);
  assert.match(rawPdf, /\/ToUnicode/);
});
