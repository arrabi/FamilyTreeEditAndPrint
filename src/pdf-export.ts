import PDFDocument, * as PDFKit from 'pdfkit';
import Helvetica from 'pdfkit/standard-fonts/Helvetica';
import {
  A3_LANDSCAPE,
  canvasToPoints,
  visualWordRuns,
  type SpikeText,
} from './spike-model.ts';

(PDFKit as unknown as { registerStdFonts: (font: unknown) => void })
  .registerStdFonts(Helvetica);

export async function exportPdf(
  items: readonly SpikeText[],
  fontBytes: ArrayBuffer,
): Promise<Blob> {
  const pdf = new PDFDocument({
    size: [A3_LANDSCAPE.widthPoints, A3_LANDSCAPE.heightPoints],
    margin: 0,
    compress: true,
    info: {
      Title: 'Arabic canvas rendering spike',
      Author: 'Family Tree Edit & Print',
      Subject: 'Arabic shaping, mixed-script text, and vector PDF proof',
    },
  });

  const chunks: Uint8Array[] = [];
  const result = new Promise<Blob>((resolve, reject) => {
    pdf.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    pdf.on('error', reject);
    pdf.on('end', () => {
      const copy = chunks.map((chunk) => Uint8Array.from(chunk));
      resolve(new Blob(copy, { type: 'application/pdf' }));
    });
  });

  pdf.registerFont('NotoNaskhArabic', fontBytes);
  pdf
    .rect(8, 8, A3_LANDSCAPE.widthPoints - 16, A3_LANDSCAPE.heightPoints - 16)
    .lineWidth(0.8)
    .stroke('#b7a36b');

  pdf
    .font('NotoNaskhArabic')
    .fontSize(canvasToPoints(14))
    .fillColor('#605d58')
    .text('Arabic shaping spike · fictional names · A3 landscape', 36, 28, {
      lineBreak: false,
    });

  for (const item of items) {
    pdf.font('NotoNaskhArabic').fontSize(canvasToPoints(item.fontSize)).fillColor('#242321');
    const words = visualWordRuns(item.text, item.direction);
    const spaceWidth = pdf.widthOfString(' ');
    const widths = words.map((word) => pdf.widthOfString(word));
    const totalWidth = widths.reduce((sum, width) => sum + width, 0)
      + spaceWidth * Math.max(0, words.length - 1);
    let cursor = canvasToPoints(item.x);
    if (item.direction === 'rtl') cursor += canvasToPoints(item.width) - totalWidth;

    words.forEach((word, index) => {
      const arabic = /[\u0600-\u06ff]/u.test(word);
      pdf.text(word, cursor, canvasToPoints(item.y), {
        width: widths[index],
        align: arabic ? 'right' : 'left',
        baseline: 'top',
        lineBreak: false,
        features: ['calt', 'liga', 'rlig'],
      });
      cursor += widths[index] + spaceWidth;
    });
  }

  pdf
    .fontSize(canvasToPoints(10))
    .fillColor('#77716a')
    .text(
      'Vector text · embedded Noto Naskh Arabic · 420 × 297 mm',
      36,
      A3_LANDSCAPE.heightPoints - 34,
      { lineBreak: false },
    );

  pdf.end();
  return result;
}
