import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  detectAndParseTree,
  parseGedcom,
  parseSimpleJson,
  TreeParseError,
} from '../src/import/parse-tree.ts';
import { displayPersonName, selectDescendants } from '../src/import/select-descendants.ts';

const simpleJson = JSON.stringify({
  people: [
    { id: 'p1', names: { arabic: 'يوسف حداد', english: 'Yusuf Haddad' } },
    { id: 'p2', names: { arabic: 'ليلى حداد', english: 'Layla Haddad' } },
    { id: 'p3', names: { english: 'Sam Haddad' } },
  ],
  families: [
    { id: 'f1', parents: ['p1'], children: ['p2'] },
    { id: 'f2', parents: ['p2'], children: ['p3'] },
  ],
});

test('parses the documented simple JSON format without changing its source', () => {
  const original = simpleJson;
  const tree = parseSimpleJson(simpleJson);

  assert.equal(tree.people.length, 3);
  assert.equal(tree.people[0].names.arabic, 'يوسف حداد');
  assert.deepEqual(tree.families[0].childIds, ['p2']);
  assert.equal(simpleJson, original);
});

test('reports actionable JSON locations and relationship errors', () => {
  assert.throws(
    () => parseSimpleJson(JSON.stringify({ people: [{ id: 'p1', names: {} }], families: [] })),
    (error) => error instanceof TreeParseError && /people\[0\]\.names/.test(error.message),
  );
  assert.throws(
    () => parseSimpleJson(JSON.stringify({
      people: [{ id: 'p1', names: { english: 'One' } }],
      families: [{ id: 'f1', parents: ['missing'], children: [] }],
    })),
    /Family "f1" refers to missing person ID "missing"/,
  );
});

test('parses GEDCOM 5.5.1 people, families, and Arabic transliteration records', () => {
  const gedcom = `0 HEAD
1 SOUR Test
1 GEDC
2 VERS 5.5.1
2 FORM LINEAGE-LINKED
0 @I1@ INDI
1 NAME Yusuf /Haddad/
2 TRAN يوسف حداد
3 LANG Arabic
0 @I2@ INDI
1 NAME Layla /Haddad/
0 @F1@ FAM
1 HUSB @I1@
1 CHIL @I2@
0 TRLR
`;
  const tree = parseGedcom(gedcom);

  assert.deepEqual(tree.people[0].names, { english: 'Yusuf Haddad', arabic: 'يوسف حداد' });
  assert.deepEqual(tree.families[0], { id: 'F1', parentIds: ['I1'], childIds: ['I2'] });
});

test('recognizes Arabic-script primary GEDCOM names', () => {
  const tree = parseGedcom(`0 HEAD
0 @I1@ INDI
1 NAME يوسف /حداد/
0 TRLR
`);
  assert.deepEqual(tree.people[0].names, { arabic: 'يوسف حداد' });
});

test('accepts the common GEDCOM 7 record structure and rejects unsupported versions', () => {
  const gedcom = `0 HEAD
1 GEDC
2 VERS 7.0
0 @I1@ INDI
1 NAME Example /Person/
0 TRLR
`;
  assert.equal(parseGedcom(gedcom).people.length, 1);
  assert.throws(() => parseGedcom(gedcom.replace('7.0', '6.0')), /version "6\.0" is not supported/);
});

test('detects formats and gives a useful error for unknown files', () => {
  assert.equal(detectAndParseTree(simpleJson, 'tree.json').format, 'json');
  assert.throws(() => detectAndParseTree('not a tree', 'tree.txt'), /Choose a \.ged GEDCOM file/);
});

test('selects descendants, caps generations, and formats requested names', async () => {
  const fixture = await readFile(new URL('../public/fixtures/haddad-family.json', import.meta.url), 'utf8');
  const { tree } = detectAndParseTree(fixture, 'haddad-family.json');
  const selected = selectDescendants(tree, { rootId: tree.people[0].id, generations: 5, nameDisplay: 'both' });

  assert.equal(tree.people.length, 146);
  assert.equal(selected.length, 146);
  assert.equal(Math.max(...selected.map((entry) => entry.generation)), 5);
  assert.deepEqual(displayPersonName(tree.people[0], 'both'), ['يوسف نسيم', 'Yusuf Naseem']);
  assert.equal(
    selectDescendants(tree, { rootId: tree.people[0].id, generations: 1, nameDisplay: 'arabic' }).length,
    1,
  );
  assert.throws(
    () => selectDescendants(tree, { rootId: 'missing', generations: 3, nameDisplay: 'english' }),
    /does not exist/,
  );
});
