export type PageFormat = 'A4' | 'A3' | 'A2' | 'A1' | 'letter' | 'tabloid' | 'custom';
export type PageOrientation = 'portrait' | 'landscape';
export type TextDirection = 'ltr' | 'rtl';

export interface PageSize {
  widthMm: number;
  heightMm: number;
}

export interface PageSettings {
  format: PageFormat;
  orientation: PageOrientation;
  widthMm?: number;
  heightMm?: number;
  bleedMm: number;
  marginMm: number;
  cropMarks: boolean;
}

export interface PosterPerson {
  id: string;
  parentId?: string;
  name: string;
  displayText?: string;
  x: number;
  y: number;
  width?: number;
  hidden?: boolean;
  hiddenBranch?: boolean;
  direction?: TextDirection;
}

export interface PosterConnection {
  from: string;
  to: string;
}

export interface PosterFreeText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  direction?: TextDirection;
  align?: 'start' | 'middle' | 'end';
  color?: string;
}

export interface PosterDocument {
  title: string;
  page: PageSettings;
  people: PosterPerson[];
  connections: PosterConnection[];
  freeText?: PosterFreeText[];
}

const standardSizes: Record<Exclude<PageFormat, 'custom'>, PageSize> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A2: { widthMm: 420, heightMm: 594 },
  A1: { widthMm: 594, heightMm: 841 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
  tabloid: { widthMm: 279.4, heightMm: 431.8 },
};

function validatePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive number`);
  }
}

export function getPageSize(page: PageSettings): PageSize {
  let size: PageSize;
  if (page.format === 'custom') {
    if (page.widthMm === undefined || page.heightMm === undefined) {
      throw new TypeError('Custom pages need widthMm and heightMm');
    }
    size = { widthMm: page.widthMm, heightMm: page.heightMm };
  } else {
    size = standardSizes[page.format];
  }

  validatePositive(size.widthMm, 'Page width');
  validatePositive(size.heightMm, 'Page height');
  const portrait = size.widthMm <= size.heightMm;
  return (page.orientation === 'landscape') === portrait
    ? { widthMm: size.heightMm, heightMm: size.widthMm }
    : size;
}

export function getOutputPageSize(page: PageSettings): PageSize {
  if (!Number.isFinite(page.bleedMm) || page.bleedMm < 0) {
    throw new RangeError('Bleed must be zero or greater');
  }
  const size = getPageSize(page);
  return {
    widthMm: size.widthMm + page.bleedMm * 2,
    heightMm: size.heightMm + page.bleedMm * 2,
  };
}

export function visiblePeople(document: PosterDocument): PosterPerson[] {
  const people = new Map(document.people.map((person) => [person.id, person]));
  const isInHiddenBranch = (person: PosterPerson): boolean => {
    if (person.hiddenBranch) return true;
    const parent = person.parentId ? people.get(person.parentId) : undefined;
    return parent ? isInHiddenBranch(parent) : false;
  };

  return document.people.filter((person) => !person.hidden && !isInHiddenBranch(person));
}

export function personText(person: PosterPerson): string {
  return person.displayText ?? person.name;
}
