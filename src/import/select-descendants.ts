import type { ChartSelection, FamilyTree, SelectedPerson } from '../model/tree';

export function selectDescendants(tree: FamilyTree, selection: ChartSelection): SelectedPerson[] {
  const people = new Map(tree.people.map((person) => [person.id, person]));
  if (!people.has(selection.rootId)) {
    throw new RangeError(`Root person "${selection.rootId}" does not exist.`);
  }
  if (!Number.isInteger(selection.generations) || selection.generations < 1) {
    throw new RangeError('Generation count must be a positive whole number.');
  }

  const children = new Map<string, string[]>();
  for (const family of tree.families) {
    for (const parentId of family.parentIds) {
      children.set(parentId, [...(children.get(parentId) ?? []), ...family.childIds]);
    }
  }

  const visited = new Map<string, number>();
  const queue: Array<{ id: string; generation: number }> = [{ id: selection.rootId, generation: 1 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.generation > selection.generations) continue;
    const previousGeneration = visited.get(current.id);
    if (previousGeneration !== undefined && previousGeneration <= current.generation) continue;
    visited.set(current.id, current.generation);
    for (const childId of children.get(current.id) ?? []) {
      queue.push({ id: childId, generation: current.generation + 1 });
    }
  }

  return [...visited]
    .map(([id, generation]) => ({ person: people.get(id), generation }))
    .filter((entry): entry is SelectedPerson => entry.person !== undefined)
    .sort((left, right) => left.generation - right.generation);
}

export function displayPersonName(person: SelectedPerson['person'], display: ChartSelection['nameDisplay']): string[] {
  if (display === 'arabic' && person.names.arabic) return [person.names.arabic];
  if (display === 'english' && person.names.english) return [person.names.english];
  if (display === 'both') {
    const names = [person.names.arabic, person.names.english].filter((name): name is string => Boolean(name));
    if (names.length > 0) return names;
  }
  return [person.names.english ?? person.names.arabic ?? person.id];
}
