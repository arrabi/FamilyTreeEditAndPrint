export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface Person {
  id: string;
  displayName: string;
  [key: string]: JsonValue;
}

export interface Relationship {
  id: string;
  type: string;
  from: string;
  to: string;
  [key: string]: JsonValue;
}

export interface Position {
  x: number;
  y: number;
  [key: string]: JsonValue;
}

export interface Page {
  paper: string;
  widthMm: number;
  heightMm: number;
  orientation: 'portrait' | 'landscape';
  marginsMm: { top: number; right: number; bottom: number; left: number };
  bleedMm: number;
  [key: string]: JsonValue;
}

export interface PosterContent {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: JsonValue;
}

export interface ProjectV1 {
  format: 'family-tree-poster-project';
  version: 1;
  tree: {
    people: Person[];
    relationships: Relationship[];
    [key: string]: JsonValue;
  };
  positions: Record<string, Position>;
  hiddenItemIds: string[];
  displayOverrides: Record<string, JsonValue>;
  page: Page;
  style: {
    chart: string;
    theme: JsonValue;
    [key: string]: JsonValue;
  };
  posterContent: PosterContent[];
}

export class ProjectFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectFileError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new ProjectFileError(`${path} must be an object.`);
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ProjectFileError(`${path} must be a non-empty string.`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ProjectFileError(`${path} must be a finite number.`);
  }
  return value;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new ProjectFileError(`${path} must be an array.`);
  return value;
}

function validatePerson(value: unknown, index: number): void {
  const person = requireRecord(value, `tree.people[${index}]`);
  requireString(person.id, `tree.people[${index}].id`);
  requireString(person.displayName, `tree.people[${index}].displayName`);
}

function validateRelationship(value: unknown, index: number): void {
  const relationship = requireRecord(value, `tree.relationships[${index}]`);
  for (const field of ['id', 'type', 'from', 'to']) {
    requireString(relationship[field], `tree.relationships[${index}].${field}`);
  }
}

function validatePage(value: unknown): void {
  const page = requireRecord(value, 'page');
  requireString(page.paper, 'page.paper');
  requireFiniteNumber(page.widthMm, 'page.widthMm');
  requireFiniteNumber(page.heightMm, 'page.heightMm');
  requireFiniteNumber(page.bleedMm, 'page.bleedMm');
  if (page.widthMm as number <= 0 || page.heightMm as number <= 0) {
    throw new ProjectFileError('page dimensions must be greater than zero.');
  }
  if (page.bleedMm as number < 0) throw new ProjectFileError('page.bleedMm cannot be negative.');
  if (page.orientation !== 'portrait' && page.orientation !== 'landscape') {
    throw new ProjectFileError('page.orientation must be portrait or landscape.');
  }
  const margins = requireRecord(page.marginsMm, 'page.marginsMm');
  for (const field of ['top', 'right', 'bottom', 'left']) {
    requireFiniteNumber(margins[field], `page.marginsMm.${field}`);
    if (margins[field] as number < 0) {
      throw new ProjectFileError(`page.marginsMm.${field} cannot be negative.`);
    }
  }
}

function validateProject(value: unknown): ProjectV1 {
  const project = requireRecord(value, 'Project');
  if (project.format !== 'family-tree-poster-project') {
    throw new ProjectFileError('This is not a Family Tree Edit & Print project file.');
  }
  if (project.version !== 1) {
    const version = typeof project.version === 'number' ? project.version : 'missing';
    throw new ProjectFileError(`Unsupported project version: ${version}.`);
  }

  const tree = requireRecord(project.tree, 'tree');
  requireArray(tree.people, 'tree.people').forEach(validatePerson);
  requireArray(tree.relationships, 'tree.relationships').forEach(validateRelationship);

  const positions = requireRecord(project.positions, 'positions');
  for (const [id, valueAtId] of Object.entries(positions)) {
    const position = requireRecord(valueAtId, `positions.${id}`);
    requireFiniteNumber(position.x, `positions.${id}.x`);
    requireFiniteNumber(position.y, `positions.${id}.y`);
  }

  requireArray(project.hiddenItemIds, 'hiddenItemIds').forEach((id, index) => {
    requireString(id, `hiddenItemIds[${index}]`);
  });
  requireRecord(project.displayOverrides, 'displayOverrides');
  validatePage(project.page);

  const style = requireRecord(project.style, 'style');
  requireString(style.chart, 'style.chart');
  if (!Object.hasOwn(style, 'theme')) throw new ProjectFileError('style.theme is required.');

  requireArray(project.posterContent, 'posterContent').forEach((valueAtIndex, index) => {
    const content = requireRecord(valueAtIndex, `posterContent[${index}]`);
    for (const field of ['id', 'type']) {
      requireString(content[field], `posterContent[${index}].${field}`);
    }
    for (const field of ['x', 'y', 'width', 'height']) {
      requireFiniteNumber(content[field], `posterContent[${index}].${field}`);
    }
  });

  return project as unknown as ProjectV1;
}

export function parseProject(source: string): ProjectV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new ProjectFileError('The project file is not valid JSON.');
  }
  return validateProject(parsed);
}

export function serializeProject(project: ProjectV1): string {
  validateProject(project);
  return `${JSON.stringify(project, null, 2)}\n`;
}

export function createEmptyProject(): ProjectV1 {
  return {
    format: 'family-tree-poster-project',
    version: 1,
    tree: { people: [], relationships: [] },
    positions: {},
    hiddenItemIds: [],
    displayOverrides: {},
    page: {
      paper: 'A3',
      widthMm: 420,
      heightMm: 297,
      orientation: 'landscape',
      marginsMm: { top: 12, right: 12, bottom: 12, left: 12 },
      bleedMm: 0,
    },
    style: { chart: 'box', theme: 'classic-gold' },
    posterContent: [],
  };
}
