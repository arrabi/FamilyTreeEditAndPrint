import type { Person } from '../model/tree';

export interface PlacedPerson {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

export interface CompactTreeLayout {
  boxes: PlacedPerson[];
  width: number;
  height: number;
}

export interface TreeFit {
  scale: number;
  x: number;
  y: number;
  fontSize: number;
  textWidth: number;
}

const BOX_HEIGHT = 4.5;
const ROW_GAP = 0.7;
const COLUMN_GAP = 6;
const FONT_SIZE = 2.1;
const MAX_ROWS_PER_COLUMN = 55;

function personDepth(person: Person, byId: Map<string, Person>, visiting = new Set<string>()): number {
  if (!person.parentId) return 0;
  if (visiting.has(person.id)) throw new Error('The family tree contains a parent cycle.');
  visiting.add(person.id);
  const parent = byId.get(person.parentId);
  if (!parent) throw new Error(`Missing parent ${person.parentId} for ${person.id}.`);
  return personDepth(parent, byId, visiting) + 1;
}

function nameWidth(name: string): number {
  return Math.max(24, [...name].length * 1.35 + 6);
}

export function compactTreeLayout(people: readonly Person[]): CompactTreeLayout {
  if (people.length === 0) return { boxes: [], width: 0, height: 0 };

  const byId = new Map(people.map((person) => [person.id, person]));
  const generations = new Map<number, Person[]>();
  for (const person of people) {
    const generation = personDepth(person, byId);
    generations.set(generation, [...(generations.get(generation) ?? []), person]);
  }

  const generationNumbers = [...generations.keys()].sort((a, b) => a - b);
  const maxBoxWidth = Math.max(...people.map((person) => nameWidth(person.name)));
  const columnCounts = generationNumbers.map((generation) =>
    Math.ceil((generations.get(generation)?.length ?? 0) / MAX_ROWS_PER_COLUMN));
  const columnsPerLane = Math.max(...columnCounts);
  const laneWidth = columnsPerLane * maxBoxWidth + Math.max(0, columnsPerLane - 1) * COLUMN_GAP;
  const boxes: PlacedPerson[] = [];

  for (const generation of generationNumbers) {
    const generationPeople = generations.get(generation) ?? [];
    const subColumns = Math.max(1, Math.ceil(generationPeople.length / MAX_ROWS_PER_COLUMN));
    const rowsPerColumn = Math.ceil(generationPeople.length / subColumns);
    const generationHeight = rowsPerColumn * BOX_HEIGHT + Math.max(0, rowsPerColumn - 1) * ROW_GAP;

    generationPeople.forEach((person, index) => {
      const subColumn = Math.floor(index / rowsPerColumn);
      const row = index % rowsPerColumn;
      const width = Math.min(maxBoxWidth, nameWidth(person.name));
      boxes.push({
        person,
        generation,
        x: generation * (laneWidth + COLUMN_GAP) + subColumn * (maxBoxWidth + COLUMN_GAP),
        y: row * (BOX_HEIGHT + ROW_GAP) - generationHeight / 2,
        width,
        height: BOX_HEIGHT,
      });
    });
  }

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const width = Math.max(...boxes.map((box) => box.x + box.width)) - minX;
  const height = Math.max(...boxes.map((box) => box.y + box.height)) - minY;
  return {
    boxes: boxes.map((box) => ({ ...box, x: box.x - minX, y: box.y - minY })),
    width,
    height,
  };
}

export function fitTree(
  layout: CompactTreeLayout,
  area: { width: number; height: number },
  origin: { x: number; y: number } = { x: 0, y: 0 },
): TreeFit {
  if (layout.width <= 0 || layout.height <= 0) {
    return { scale: 1, x: origin.x, y: origin.y, fontSize: FONT_SIZE, textWidth: 0 };
  }
  const scale = Math.min(area.width / layout.width, area.height / layout.height);
  return {
    scale,
    x: origin.x + (area.width - layout.width * scale) / 2,
    y: origin.y + (area.height - layout.height * scale) / 2,
    fontSize: FONT_SIZE * scale,
    textWidth: layout.width * scale,
  };
}
