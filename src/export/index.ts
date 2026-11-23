import { loadExportFonts } from './fonts.ts';
import { getOutputPageSize, type PosterDocument } from './model.ts';
import { renderPdf } from './pdf.ts';
import { svgToPng } from './png.ts';
import { renderSvg } from './svg.ts';

export type ExportFormat = 'pdf' | 'svg' | 'png';

export interface ExportOptions {
  format: ExportFormat;
  dpi?: number;
}

export async function createExport(document: PosterDocument, options: ExportOptions): Promise<Blob> {
  const fonts = await loadExportFonts();
  const svg = renderSvg(document, fonts.svg);
  const size = getOutputPageSize(document.page);
  if (options.format === 'svg') return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  if (options.format === 'png') return svgToPng(svg, size.widthMm, size.heightMm, options.dpi ?? 300);
  const pdf = await renderPdf(document, fonts);
  return new Blob([pdf as BlobPart], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
