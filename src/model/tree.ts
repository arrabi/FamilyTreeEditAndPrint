export type NameDisplay = 'arabic' | 'english' | 'both';

export interface Person {
  id: string;
  names: {
    arabic?: string;
    english?: string;
  };
}

export interface Family {
  id: string;
  parentIds: string[];
  childIds: string[];
}

export interface FamilyTree {
  people: Person[];
  families: Family[];
}

export interface ChartSelection {
  rootId: string;
  generations: number;
  nameDisplay: NameDisplay;
}

export interface SelectedPerson {
  person: Person;
  generation: number;
}
