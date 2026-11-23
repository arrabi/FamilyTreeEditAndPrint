export type MoveMode = 'person' | 'couple' | 'branch';

export interface Person {
  id: string;
  name: string;
  detail: string;
  x: number;
  y: number;
  parentIds: string[];
  partnerId?: string;
}

export interface PersonTree {
  width: number;
  height: number;
  people: Person[];
}

export interface Point {
  x: number;
  y: number;
}

export interface AlignmentGuide {
  axis: 'x' | 'y';
  value: number;
}

export const PERSON_WIDTH = 122;
export const PERSON_HEIGHT = 52;
export const SNAP_DISTANCE = 8;

export const demoTree: PersonTree = {
  width: 1180,
  height: 835,
  people: [
    { id: 'nadia', name: 'نادية حداد', detail: 'Nadia Haddad', x: 529, y: 42, parentIds: [] },
    { id: 'yusuf', name: 'Yusuf Haddad', detail: 'b. 1948', x: 529, y: 164, parentIds: ['nadia'] },
    { id: 'samira', name: 'سلمى حداد', detail: 'Samira Haddad', x: 683, y: 164, parentIds: ['nadia'], partnerId: 'yusuf' },
    { id: 'omar', name: 'Omar Haddad', detail: 'b. 1975', x: 260, y: 306, parentIds: ['yusuf', 'samira'] },
    { id: 'leila', name: 'Leila Haddad', detail: 'b. 1978', x: 422, y: 306, parentIds: ['yusuf', 'samira'] },
    { id: 'hadi', name: 'هادي حداد', detail: 'Hadi Haddad', x: 606, y: 306, parentIds: ['yusuf', 'samira'] },
    { id: 'maya', name: 'Maya Haddad', detail: 'b. 1982', x: 768, y: 306, parentIds: ['yusuf', 'samira'] },
    { id: 'adam', name: 'Adam Nouri', detail: 'b. 2002', x: 178, y: 482, parentIds: ['omar'] },
    { id: 'dina', name: 'دينا نوري', detail: 'Dina Nouri', x: 340, y: 482, parentIds: ['omar'] },
    { id: 'noor', name: 'Noor Saleh', detail: 'b. 2005', x: 524, y: 482, parentIds: ['leila'] },
    { id: 'rani', name: 'راني حداد', detail: 'Rani Haddad', x: 686, y: 482, parentIds: ['hadi'] },
    { id: 'zina', name: 'Zina Haddad', detail: 'b. 2009', x: 848, y: 482, parentIds: ['maya'] },
  ],
};

export function cloneTree(tree: PersonTree): PersonTree {
  return { ...tree, people: tree.people.map((person) => ({ ...person, parentIds: [...person.parentIds] })) };
}

export function movementIds(
  people: Person[],
  selectedIds: Set<string>,
  mode: MoveMode,
): Set<string> {
  const result = new Set(selectedIds);
  if (mode === 'couple' || mode === 'branch') {
    for (const person of people) {
      if (selectedIds.has(person.id) && person.partnerId) result.add(person.partnerId);
    }
  }
  if (mode === 'branch') {
    let changed = true;
    while (changed) {
      changed = false;
      for (const person of people) {
        if (!result.has(person.id) && person.parentIds.some((id) => result.has(id))) {
          result.add(person.id);
          changed = true;
        }
      }
    }
  }
  return result;
}

export function translatePeople(people: Person[], ids: Set<string>, dx: number, dy: number): Person[] {
  return people.map((person) =>
    ids.has(person.id) ? { ...person, x: person.x + dx, y: person.y + dy } : person,
  );
}

export function personContains(person: Person, point: Point): boolean {
  return point.x >= person.x
    && point.x <= person.x + PERSON_WIDTH
    && point.y >= person.y
    && point.y <= person.y + PERSON_HEIGHT;
}

export function connectorPath(parent: Person, child: Person): string {
  const startX = parent.x + PERSON_WIDTH / 2;
  const startY = parent.y + PERSON_HEIGHT;
  const endX = child.x + PERSON_WIDTH / 2;
  const endY = child.y;
  const middleY = startY + (endY - startY) / 2;
  return `M ${startX} ${startY} V ${middleY} H ${endX} V ${endY}`;
}

const alignmentValues = (person: Person): Point => ({
  x: person.x + PERSON_WIDTH / 2,
  y: person.y + PERSON_HEIGHT / 2,
});

export function snapTranslation(
  people: Person[],
  movingIds: Set<string>,
  dx: number,
  dy: number,
  threshold = SNAP_DISTANCE,
): { dx: number; dy: number; guides: AlignmentGuide[] } {
  const moving = people.filter((person) => movingIds.has(person.id));
  const fixed = people.filter((person) => !movingIds.has(person.id));
  if (moving.length === 0) return { dx, dy, guides: [] };

  let snappedDx = dx;
  let snappedDy = dy;
  let bestX = threshold + 1;
  let bestY = threshold + 1;
  let guideX: AlignmentGuide | undefined;
  let guideY: AlignmentGuide | undefined;
  for (const movingPerson of moving) {
    const movingPoint = alignmentValues(movingPerson);
    for (const fixedPerson of fixed) {
      const fixedPoint = alignmentValues(fixedPerson);
      const distanceX = Math.abs(movingPoint.x + dx - fixedPoint.x);
      const distanceY = Math.abs(movingPoint.y + dy - fixedPoint.y);
      if (distanceX < bestX) {
        bestX = distanceX;
        snappedDx = dx + fixedPoint.x - (movingPoint.x + dx);
        guideX = { axis: 'x', value: fixedPoint.x };
      }
      if (distanceY < bestY) {
        bestY = distanceY;
        snappedDy = dy + fixedPoint.y - (movingPoint.y + dy);
        guideY = { axis: 'y', value: fixedPoint.y };
      }
    }
  }
  return {
    dx: bestX <= threshold ? snappedDx : dx,
    dy: bestY <= threshold ? snappedDy : dy,
    guides: [
      ...(bestX <= threshold && guideX ? [guideX] : []),
      ...(bestY <= threshold && guideY ? [guideY] : []),
    ],
  };
}

export function worldPoint(clientX: number, clientY: number, bounds: DOMRectLike, pan: Point, scale: number): Point {
  return { x: (clientX - bounds.left - pan.x) / scale, y: (clientY - bounds.top - pan.y) / scale };
}

export interface DOMRectLike {
  left: number;
  top: number;
}

export class EditorHistory {
  private states: PersonTree[] = [];
  private index = -1;

  constructor(initial: PersonTree) {
    this.push(initial);
  }

  get canUndo(): boolean {
    return this.index > 0;
  }

  get canRedo(): boolean {
    return this.index < this.states.length - 1;
  }

  push(tree: PersonTree): void {
    const next = cloneTree(tree);
    const current = this.states[this.index];
    if (current && JSON.stringify(current) === JSON.stringify(next)) return;
    this.states = [...this.states.slice(0, this.index + 1), next];
    this.index += 1;
  }

  undo(): PersonTree | undefined {
    if (!this.canUndo) return undefined;
    this.index -= 1;
    return cloneTree(this.states[this.index]!);
  }

  redo(): PersonTree | undefined {
    if (!this.canRedo) return undefined;
    this.index += 1;
    return cloneTree(this.states[this.index]!);
  }
}
