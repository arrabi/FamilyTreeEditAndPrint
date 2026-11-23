export type ChartStyle = 'classic' | 'leaf';

export interface Person {
  id: string;
  parentId?: string;
  name: string;
  englishName: string;
  spouseName?: string;
  living: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export type PositionOverrides = Record<string, Point>;

export interface ChartModel {
  people: Person[];
  positions: PositionOverrides;
}

export const PAGE_WIDTH = 1000;
export const PAGE_HEIGHT = 707;

const samplePeople: Person[] = [
  { id: 'root', name: 'يوسف حداد', englishName: 'Yusuf Haddad', spouseName: 'ليلى Haddad', living: false },
  { id: 'omar', parentId: 'root', name: 'عمر', englishName: 'Omar Haddad', spouseName: 'Maya حداد', living: false },
  { id: 'nadia', parentId: 'root', name: 'نادية', englishName: 'Nadia Haddad', spouseName: 'Samir نور', living: true },
  { id: 'salma', parentId: 'omar', name: 'سلمى', englishName: 'Salma Haddad', living: true },
  { id: 'karim', parentId: 'omar', name: 'كريم', englishName: 'Karim Haddad', living: true },
  { id: 'dina', parentId: 'nadia', name: 'دينا', englishName: 'Dina Noor', spouseName: 'Rami نور', living: true },
  { id: 'fadi', parentId: 'salma', name: 'فادي', englishName: 'Fadi Haddad', living: true },
  { id: 'hana', parentId: 'salma', name: 'هنا', englishName: 'Hana Haddad', living: true },
  { id: 'amir', parentId: 'karim', name: 'أمير', englishName: 'Amir Haddad', spouseName: 'Lina Haddad', living: true },
  { id: 'layan', parentId: 'dina', name: 'ليان', englishName: 'Layan Noor', living: true },
  { id: 'reem', parentId: 'dina', name: 'ريم', englishName: 'Reem Noor', living: true },
  { id: 'zayd', parentId: 'fadi', name: 'زيد', englishName: 'Zayd Haddad', living: true },
  { id: 'mira', parentId: 'fadi', name: 'ميرا', englishName: 'Mira Haddad', living: true },
  { id: 'adam', parentId: 'hana', name: 'آدم', englishName: 'Adam Haddad', living: true },
  { id: 'noor', parentId: 'amir', name: 'نور', englishName: 'Noor Haddad', living: true },
];

export function createSampleChart(): ChartModel {
  return { people: structuredClone(samplePeople), positions: {} };
}

export function descendants(people: Person[], id: string): Set<string> {
  const result = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const person of people) {
      if (person.parentId && result.has(person.parentId) && !result.has(person.id)) {
        result.add(person.id);
        changed = true;
      }
    }
  }
  return result;
}

export function movePerson(model: ChartModel, style: ChartStyle, id: string, delta: Point): ChartModel {
  const base = layoutPeople(model.people, style);
  const movedIds = descendants(model.people, id);
  const positions = { ...model.positions };
  for (const personId of movedIds) {
    const current = positions[personId] ?? { x: 0, y: 0 };
    const personBase = base[personId];
    positions[personId] = {
      x: Math.max(-personBase.x + 40, Math.min(PAGE_WIDTH - personBase.x - 40, current.x + delta.x)),
      y: Math.max(-personBase.y + 40, Math.min(PAGE_HEIGHT - personBase.y - 40, current.y + delta.y)),
    };
  }
  return { ...model, positions };
}

export function layoutPeople(people: Person[], style: ChartStyle): Record<string, Point> {
  return style === 'leaf' ? leafLayout(people) : classicLayout(people);
}

export function chartPositions(model: ChartModel, style: ChartStyle): Record<string, Point> {
  const automatic = layoutPeople(model.people, style);
  return Object.fromEntries(
    Object.entries(automatic).map(([id, point]) => [
      id,
      {
        x: point.x + (model.positions[id]?.x ?? 0),
        y: point.y + (model.positions[id]?.y ?? 0),
      },
    ]),
  );
}

function depthOf(person: Person, byId: Map<string, Person>): number {
  let depth = 0;
  let current = person;
  while (current.parentId) {
    current = byId.get(current.parentId) ?? current;
    depth += 1;
  }
  return depth;
}

function classicLayout(people: Person[]): Record<string, Point> {
  const byId = new Map(people.map((person) => [person.id, person]));
  const rows = new Map<number, Person[]>();
  for (const person of people) {
    const depth = depthOf(person, byId);
    rows.set(depth, [...(rows.get(depth) ?? []), person]);
  }
  const positions: Record<string, Point> = {};
  for (const [depth, row] of rows) {
    const gap = 870 / Math.max(row.length, 1);
    row.forEach((person, index) => {
      positions[person.id] = { x: 65 + gap * (index + 0.5), y: 122 + depth * 128 };
    });
  }
  return positions;
}

function leafLayout(people: Person[]): Record<string, Point> {
  const positions: Record<string, Point> = {};
  const children = new Map<string, Person[]>();
  for (const person of people) {
    if (person.parentId) {
      children.set(person.parentId, [...(children.get(person.parentId) ?? []), person]);
    }
  }
  let leafIndex = 0;
  const place = (person: Person, depth = 0): number => {
    const descendants = children.get(person.id) ?? [];
    const childY = descendants.map((child) => place(child, depth + 1));
    const y = childY.length ? (Math.min(...childY) + Math.max(...childY)) / 2 : 100 + leafIndex++ * 76;
    positions[person.id] = { x: 910 - depth * 190, y };
    return y;
  };
  const roots = people.filter((person) => !person.parentId);
  roots.forEach(place);
  return positions;
}

function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function leafPath(from: Point, to: Point, width: number): string {
  const direction = from.x > to.x ? -1 : 1;
  const distance = Math.abs(from.x - to.x);
  const rootHalfWidth = Math.max(1.5, width / 2);
  return `M ${from.x} ${from.y - rootHalfWidth} C ${from.x + direction * distance * 0.48} ${from.y}, ${to.x - direction * distance * 0.48} ${to.y - 0.8}, ${to.x} ${to.y - 0.8} C ${to.x - direction * distance * 0.48} ${to.y + 0.8}, ${from.x + direction * distance * 0.48} ${from.y}, ${from.x} ${from.y + rootHalfWidth} Z`;
}

export function renderChartSvg(model: ChartModel, style: ChartStyle): string {
  const positions = chartPositions(model, style);
  const connectors = model.people
    .filter((person) => person.parentId)
    .map((person) => {
      const from = positions[person.parentId!];
      const to = positions[person.id];
      if (style === 'classic') {
        const middleY = (from.y + to.y) / 2;
        return `<path d="M ${from.x} ${from.y + 22} V ${middleY} H ${to.x} V ${to.y - 22}" class="box-link"/>`;
      }
      const branchWidth = Math.min(16, 2 + descendants(model.people, person.id).size * 1.8);
      return `<path d="${leafPath(from, to, branchWidth)}" class="branch"/>`;
    })
    .join('');

  const marks = model.people
    .map((person) => {
      const point = positions[person.id];
      const details = `${person.name} · ${person.englishName}${person.spouseName ? ` ∞ ${person.spouseName}` : ''}`;
      if (style === 'classic') {
        return `<g class="person box-person" data-person-id="${person.id}" transform="translate(${point.x} ${point.y})" tabindex="0" role="button" aria-label="Move ${escapeXml(details)}">
          <rect x="-62" y="-22" width="124" height="44" rx="6"/>
          <text y="-3" direction="auto">${escapeXml(person.name)}</text>
          <text class="secondary-name" y="11" direction="auto">${escapeXml(person.englishName)}</text>
          ${person.spouseName ? `<text class="spouse" y="19" direction="auto">∞ ${escapeXml(person.spouseName)}</text>` : ''}
        </g>`;
      }
      const leafClass = person.living ? 'living-leaf' : 'deceased-leaf';
      return `<g class="person leaf-person" data-person-id="${person.id}" transform="translate(${point.x} ${point.y})" tabindex="0" role="button" aria-label="Move ${escapeXml(details)}">
        <path class="${leafClass}" d="M 0 0 C 12 -13 31 -11 37 0 C 24 11 9 11 0 0 Z"/>
        <text x="-9" y="-7" text-anchor="end" direction="auto">${escapeXml(person.name)}</text>
        <text class="secondary-name" x="-9" y="8" text-anchor="end" direction="auto">${escapeXml(person.englishName)}</text>
        ${person.spouseName ? `<text class="spouse" x="-9" y="23" text-anchor="end" direction="auto">∞ ${escapeXml(person.spouseName)}</text>` : ''}
      </g>`;
    })
    .join('');

  const legend = style === 'leaf'
    ? `<g class="legend" transform="translate(72 666)">
        <ellipse class="living-leaf" cx="0" cy="0" rx="8" ry="4"/><text x="15" y="4">حي / Living</text>
        <ellipse class="deceased-leaf" cx="92" cy="0" rx="8" ry="4"/><text x="107" y="4">متوفى / Deceased</text>
        <text x="235" y="4">∞ spouse</text>
      </g>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}" width="420mm" height="297mm" role="img" aria-labelledby="chart-title chart-description">
    <title id="chart-title">عائلة حداد · The Haddad family</title>
    <desc id="chart-description">A fictional five-generation family chart in ${style === 'leaf' ? 'leaf tree' : 'classic box'} style.</desc>
    <rect width="${PAGE_WIDTH}" height="${PAGE_HEIGHT}" class="paper"/>
    <g class="poster-frame"><rect x="25" y="25" width="950" height="657" rx="3"/></g>
    <text class="poster-title" x="958" y="62" text-anchor="end" direction="ltr" unicode-bidi="plaintext">شجرة عائلة حداد · Haddad Family Tree</text>
    <text class="generation-count" x="958" y="82" text-anchor="end">5 generations · شخصيات خيالية</text>
    <g class="connectors">${connectors}</g>
    <g class="people">${marks}</g>
    ${legend}
  </svg>`;
}

export function hasOverlappingClassicBoxes(model: ChartModel): boolean {
  const positions = chartPositions(model, 'classic');
  const entries = Object.entries(positions);
  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      const [idA, a] = entries[first];
      const [idB, b] = entries[second];
      if (Math.abs(a.x - b.x) < 124 && Math.abs(a.y - b.y) < 44) return idA !== idB;
    }
  }
  return false;
}
