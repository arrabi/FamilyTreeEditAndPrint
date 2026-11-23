import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFFont } from 'pdf-lib';
import {
  getOutputPageSize,
  getPageSize,
  personText,
  visiblePeople,
  type PosterDocument,
  type TextDirection,
} from './model.ts';

export interface PdfFonts {
  arabic: Uint8Array;
  latin: Uint8Array;
}

export interface ShapedTextRun {
  text: string;
  direction: TextDirection;
}

export function shapedTextRuns(text: string, direction: TextDirection): ShapedTextRun[] {
  const runs: ShapedTextRun[] = [];
  for (const character of text) {
    const isRtl = /\p{Script=Arabic}/u.test(character) || /\p{Script=Hebrew}/u.test(character);
    const runDirection: TextDirection = isRtl ? 'rtl' : 'ltr';
    const isNeutral = /\s|[()[\],.;:!?-]/u.test(character);
    const previous = runs.at(-1);
    if (isNeutral || previous?.direction === runDirection) {
      if (previous) previous.text += character;
      else runs.push({ text: character, direction });
    } else {
      runs.push({ text: character, direction: runDirection });
    }
  }
  return runs;
}

const millimetresToPoints = 72 / 25.4;

function point(value: number): number {
  return value * millimetresToPoints;
}

export async function renderPdf(document: PosterDocument, fonts: PdfFonts): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const arabic = await pdf.embedFont(fonts.arabic, { subset: false });
  const latin = await pdf.embedFont(fonts.latin, { subset: false });
  const trim = getPageSize(document.page);
  const output = getOutputPageSize(document.page);
  const page = pdf.addPage([point(output.widthMm), point(output.heightMm)]);
  const bleed = document.page.bleedMm;

  page.setTrimBox(point(bleed), point(bleed), point(trim.widthMm), point(trim.heightMm));
  page.setBleedBox(0, 0, point(output.widthMm), point(output.heightMm));
  page.drawRectangle({
    x: 0,
    y: 0,
    width: point(output.widthMm),
    height: point(output.heightMm),
    color: rgb(1, 0.992, 0.973),
  });
  page.drawRectangle({
    x: point(bleed + 4),
    y: point(bleed + 4),
    width: point(trim.widthMm - 8),
    height: point(trim.heightMm - 8),
    borderColor: rgb(0.667, 0.529, 0.286),
    borderWidth: point(1),
  });

  const visible = visiblePeople(document);
  const byId = new Map(visible.map((person) => [person.id, person]));
  for (const connection of document.connections) {
    const from = byId.get(connection.from);
    const to = byId.get(connection.to);
    if (!from || !to) continue;
    page.drawLine({
      start: { x: point(bleed + from.x), y: point(output.heightMm - bleed - from.y - 7) },
      end: { x: point(bleed + to.x), y: point(output.heightMm - bleed - to.y) },
      thickness: point(1.4),
      color: rgb(0.545, 0.416, 0.247),
    });
  }

  const drawBidiText = (
    text: string,
    x: number,
    y: number,
    sizeMm: number,
    direction: TextDirection,
    align: 'start' | 'middle' | 'end',
  ): void => {
    const runs = shapedTextRuns(text, direction);
    const width = runs.reduce((sum, run) => {
      const font: PDFFont = run.direction === 'rtl' ? arabic : latin;
      return sum + font.widthOfTextAtSize(run.text, point(sizeMm));
    }, 0);
    let cursor =
      align === 'middle' ? point(bleed + x) - width / 2 : align === 'end' ? point(bleed + x) - width : point(bleed + x);
    if (direction === 'rtl') cursor += width;
    for (const run of runs) {
      const font: PDFFont = run.direction === 'rtl' ? arabic : latin;
      const runWidth = font.widthOfTextAtSize(run.text, point(sizeMm));
      if (direction === 'rtl') cursor -= runWidth;
      page.drawText(run.text, {
        x: cursor,
        y: point(output.heightMm - bleed - y),
        size: point(sizeMm),
        font,
        color: rgb(0.2, 0.173, 0.141),
      });
      if (direction === 'ltr') cursor += runWidth;
    }
  };

  for (const person of visible) {
    const width = person.width ?? 44;
    page.drawRectangle({
      x: point(bleed + person.x - width / 2),
      y: point(output.heightMm - bleed - person.y - 7),
      width: point(width),
      height: point(12),
      borderColor: rgb(0.659, 0.533, 0.314),
      borderWidth: point(0.7),
      color: rgb(1, 0.992, 0.973),
    });
    const text = personText(person);
    drawBidiText(
      text,
      person.x,
      person.y + 2.5,
      4.4,
      person.direction ?? (/\p{Script=Arabic}/u.test(text) ? 'rtl' : 'ltr'),
      'middle',
    );
  }
  for (const text of document.freeText ?? []) {
    drawBidiText(
      text.text,
      text.x,
      text.y,
      text.fontSize,
      text.direction ?? (/\p{Script=Arabic}/u.test(text.text) ? 'rtl' : 'ltr'),
      text.align ?? 'middle',
    );
  }

  if (document.page.cropMarks && bleed > 0) {
    const marks = [
      [bleed, bleed, -2, 0],
      [bleed, bleed, 0, -2],
      [bleed + trim.widthMm, bleed, 2, 0],
      [bleed + trim.widthMm, bleed, 0, -2],
      [bleed, bleed + trim.heightMm, -2, 0],
      [bleed, bleed + trim.heightMm, 0, 2],
      [bleed + trim.widthMm, bleed + trim.heightMm, 2, 0],
      [bleed + trim.widthMm, bleed + trim.heightMm, 0, 2],
    ];
    for (const [x, y, dx, dy] of marks) {
      page.drawLine({
        start: { x: point(x), y: point(output.heightMm - y) },
        end: { x: point(x + dx), y: point(output.heightMm - y - dy) },
        thickness: point(0.25),
        color: rgb(0.333, 0.333, 0.333),
      });
    }
  }

  return pdf.save({ useObjectStreams: false });
}
