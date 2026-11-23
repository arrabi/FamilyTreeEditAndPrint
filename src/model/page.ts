export type PaperSize = 'A4' | 'A3' | 'A2' | 'A1' | 'Letter' | 'Tabloid' | 'Custom';
export type Orientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSettings {
  paperSize: PaperSize;
  orientation: Orientation;
  customWidth: number;
  customHeight: number;
  margins: PageMargins;
  bleed: number;
}

export interface PageGeometry {
  trimWidth: number;
  trimHeight: number;
  bleed: number;
  width: number;
  height: number;
  trim: { x: number; y: number; width: number; height: number };
  safe: { x: number; y: number; width: number; height: number };
}

export const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'Custom'>, readonly [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  Letter: [215.9, 279.4],
  Tabloid: [279.4, 431.8],
};

export function pageGeometry(settings: PageSettings): PageGeometry {
  const [baseWidth, baseHeight] = settings.paperSize === 'Custom'
    ? [settings.customWidth, settings.customHeight]
    : PAPER_DIMENSIONS[settings.paperSize];
  const landscape = settings.orientation === 'landscape';
  const trimWidth = landscape ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight);
  const trimHeight = landscape ? Math.min(baseWidth, baseHeight) : Math.max(baseWidth, baseHeight);
  const bleed = Math.max(0, settings.bleed);
  const width = trimWidth + bleed * 2;
  const height = trimHeight + bleed * 2;
  const marginValues = Object.values(settings.margins);
  const safe = {
    x: bleed + settings.margins.left,
    y: bleed + settings.margins.top,
    width: trimWidth - settings.margins.left - settings.margins.right,
    height: trimHeight - settings.margins.top - settings.margins.bottom,
  };

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(settings.bleed) ||
    settings.bleed < 0 ||
    marginValues.some((margin) => !Number.isFinite(margin) || margin < 0) ||
    trimWidth <= 0 ||
    trimHeight <= 0 ||
    safe.width <= 0 ||
    safe.height <= 0
  ) {
    throw new RangeError('Page dimensions and margins must leave a positive safe area.');
  }

  return {
    trimWidth,
    trimHeight,
    bleed,
    width,
    height,
    trim: { x: bleed, y: bleed, width: trimWidth, height: trimHeight },
    safe,
  };
}
