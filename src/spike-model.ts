export const A3_LANDSCAPE = {
  widthMm: 420,
  heightMm: 297,
  widthPoints: 420 * 72 / 25.4,
  heightPoints: 297 * 72 / 25.4,
} as const;

export const SPIKE_PAGE = {
  width: 560,
  height: 396,
} as const;

export interface SpikeText {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  direction: 'ltr' | 'rtl';
}

export const spikeTexts: readonly SpikeText[] = [
  {
    id: 'arabic',
    text: 'ليلى نور بن أحمد',
    x: 155,
    y: 110,
    width: 340,
    fontSize: 28,
    direction: 'rtl',
  },
  {
    id: 'english',
    text: 'Layla Noor Hartwell',
    x: 65,
    y: 190,
    width: 320,
    fontSize: 24,
    direction: 'ltr',
  },
  {
    id: 'mixed',
    text: 'ليلى Noor — أحمد Hartwell',
    x: 145,
    y: 275,
    width: 350,
    fontSize: 26,
    direction: 'rtl',
  },
];

export function createSpikeTexts(): SpikeText[] {
  return spikeTexts.map((item) => ({ ...item }));
}

export function canvasToPoints(value: number): number {
  return value * A3_LANDSCAPE.widthPoints / SPIKE_PAGE.width;
}

export function visualWordRuns(text: string, direction: 'ltr' | 'rtl'): string[] {
  const words = text.trim().split(/\s+/u);
  return direction === 'rtl' ? words.reverse() : words;
}
