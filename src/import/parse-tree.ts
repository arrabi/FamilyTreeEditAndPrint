import type { Family, FamilyTree, Person } from '../model/tree';

export type TreeFormat = 'json' | 'gedcom';

export class TreeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TreeParseError';
  }
}

function fail(message: string): never {
  throw new TreeParseError(message);
}

function requireId(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    fail(`${path} must be a non-empty string.`);
  }
  return value.trim();
}

function parseNames(value: unknown, path: string): Person['names'] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(`${path}.names must be an object containing "arabic" and/or "english".`);
  }
  const record = value as Record<string, unknown>;
  const names: Person['names'] = {};
  for (const language of ['arabic', 'english'] as const) {
    const name = record[language];
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        fail(`${path}.names.${language} must be a non-empty string when provided.`);
      }
      names[language] = name.trim();
    }
  }
  if (!names.arabic && !names.english) {
    fail(`${path}.names must include at least one Arabic or English name.`);
  }
  return names;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid JSON.';
    fail(`Invalid JSON: ${detail}`);
  }
}

export function parseSimpleJson(text: string): FamilyTree {
  const document = parseJson(text);
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    fail('JSON root must be an object with "people" and "families" arrays.');
  }
  const root = document as Record<string, unknown>;
  if (Array.isArray(root.people) === false || Array.isArray(root.families) === false) {
    fail('JSON root must contain "people" and "families" arrays.');
  }

  const people = (root.people as unknown[]).map((value, index) => {
    const path = `people[${index}]`;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      fail(`${path} must be an object.`);
    }
    const person = value as Record<string, unknown>;
    return {
      id: requireId(person.id, `${path}.id`),
      names: parseNames(person.names, path),
    };
  });

  const families = (root.families as unknown[]).map((value, index) => {
    const path = `families[${index}]`;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      fail(`${path} must be an object.`);
    }
    const family = value as Record<string, unknown>;
    const ids = (field: 'parents' | 'children'): string[] => {
      const values = family[field];
      if (!Array.isArray(values)) {
        fail(`${path}.${field} must be an array of person IDs.`);
      }
      return values.map((id, idIndex) => requireId(id, `${path}.${field}[${idIndex}]`));
    };
    return {
      id: requireId(family.id, `${path}.id`),
      parentIds: ids('parents'),
      childIds: ids('children'),
    };
  });

  return validateTree({ people, families });
}

interface GedcomRecord {
  id: string;
  type: 'person' | 'family';
  lines: Array<{ level: number; tag: string; value: string; line: number }>;
}

function cleanGedcomName(value: string): string {
  return value.replaceAll('/', '').replace(/\s+/g, ' ').trim();
}

export function parseGedcom(text: string): FamilyTree {
  const records: GedcomRecord[] = [];
  let current: GedcomRecord | undefined;
  let version: string | undefined;

  text.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((raw, index) => {
    if (!raw.trim()) return;
    const match = /^(\d+)\s+(@[^@]+@|\S+)(?:\s+(.*))?$/.exec(raw.trim());
    if (!match) fail(`GEDCOM line ${index + 1} is not valid: expected "level [tag] [value]".`);
    const level = Number(match[1]);
    const token = match[2];
    const value = match[3] ?? '';
    if (level === 0 && /^@\S+@$/.test(token)) {
      const typeToken = value.split(/\s+/, 1)[0];
      if (typeToken === 'INDI' || typeToken === 'FAM') {
        current = { id: token.slice(1, -1), type: typeToken === 'INDI' ? 'person' : 'family', lines: [] };
        records.push(current);
      } else {
        current = undefined;
      }
      return;
    }
    if (token === 'VERS') version = value;
    current?.lines.push({ level, tag: token, value, line: index + 1 });
  });

  if (version && !/^(5\.5\.1|7(?:\.0)?)$/.test(version)) {
    fail(`GEDCOM version "${version}" is not supported. Use GEDCOM 5.5.1 or 7.`);
  }
  if (!text.includes('\n0 HEAD') && !/^0 HEAD/m.test(text)) {
    fail('GEDCOM file is missing the required 0 HEAD record.');
  }

  const people: Person[] = [];
  const families: Family[] = [];
  for (const record of records) {
    if (record.type === 'person') {
      const names: Person['names'] = {};
      for (let i = 0; i < record.lines.length; i += 1) {
        const line = record.lines[i];
        if (line.tag === 'NAME') {
          const name = cleanGedcomName(line.value);
          if (/[\u0600-\u06ff]/u.test(name)) names.arabic ||= name;
          else names.english ||= name;
        }
        if (line.tag === '_ARABIC_NAME') names.arabic ||= cleanGedcomName(line.value);
        if (line.tag === 'TRAN') {
          const language = record.lines.slice(i + 1).find((next) => next.level <= line.level);
          const languageLine = record.lines.slice(i + 1, language ? record.lines.indexOf(language) : undefined)
            .find((next) => next.level > line.level && next.tag === 'LANG');
          if (/^(ar(?:-|$)|arabic)/iu.test(languageLine?.value ?? '')) {
            names.arabic ||= cleanGedcomName(line.value);
          }
        }
      }
      if (!names.arabic && !names.english) {
        fail(`GEDCOM person @${record.id}@ has no NAME.`);
      }
      people.push({ id: record.id, names });
    } else {
      const parents = record.lines.filter((line) => line.level === 1 && (line.tag === 'HUSB' || line.tag === 'WIFE'))
        .map((line) => line.value.replaceAll('@', ''));
      const children = record.lines.filter((line) => line.level === 1 && line.tag === 'CHIL')
        .map((line) => line.value.replaceAll('@', ''));
      families.push({ id: record.id, parentIds: parents, childIds: children });
    }
  }
  return validateTree({ people, families });
}

function validateTree(tree: FamilyTree): FamilyTree {
  if (tree.people.length === 0) fail('No people were found in this file.');
  const personIds = new Set<string>();
  for (const person of tree.people) {
    if (personIds.has(person.id)) fail(`Duplicate person ID "${person.id}". Each person needs a unique ID.`);
    personIds.add(person.id);
  }
  const familyIds = new Set<string>();
  for (const family of tree.families) {
    if (familyIds.has(family.id)) fail(`Duplicate family ID "${family.id}". Each family needs a unique ID.`);
    familyIds.add(family.id);
    for (const id of [...family.parentIds, ...family.childIds]) {
      if (!personIds.has(id)) fail(`Family "${family.id}" refers to missing person ID "${id}".`);
    }
  }
  return tree;
}

export function detectAndParseTree(text: string, fileName = ''): { tree: FamilyTree; format: TreeFormat } {
  const source = text.trimStart();
  if (source.startsWith('{') || fileName.toLowerCase().endsWith('.json')) {
    return { tree: parseSimpleJson(text), format: 'json' };
  }
  if (/^0 HEAD/m.test(source) || fileName.toLowerCase().endsWith('.ged')) {
    return { tree: parseGedcom(text), format: 'gedcom' };
  }
  fail('Choose a .ged GEDCOM file or a .json file in the documented format.');
}
