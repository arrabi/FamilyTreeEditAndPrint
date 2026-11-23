export interface Person {
  id: string;
  sourceName: string;
  parentId?: string;
}

export interface PersonPresentation {
  hidden: boolean;
  displayText?: string;
}

export interface PosterProject {
  people: readonly Person[];
  presentation: Readonly<Record<string, PersonPresentation>>;
}

export interface PosterPerson extends Person {
  displayText: string;
}

export function setPersonHidden(
  project: PosterProject,
  personId: string,
  hidden: boolean,
): PosterProject {
  return {
    ...project,
    presentation: {
      ...project.presentation,
      [personId]: {
        ...project.presentation[personId],
        hidden,
      },
    },
  };
}

export function setBranchHidden(
  project: PosterProject,
  personId: string,
  hidden: boolean,
): PosterProject {
  const branch = new Set([personId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const person of project.people) {
      if (person.parentId && branch.has(person.parentId) && !branch.has(person.id)) {
        branch.add(person.id);
        changed = true;
      }
    }
  }

  const presentation = { ...project.presentation };
  for (const id of branch) {
    presentation[id] = {
      ...presentation[id],
      hidden,
    };
  }

  return { ...project, presentation };
}

export function setDisplayText(
  project: PosterProject,
  personId: string,
  displayText: string,
): PosterProject {
  const override = displayText.trim();
  return {
    ...project,
    presentation: {
      ...project.presentation,
      [personId]: {
        hidden: project.presentation[personId]?.hidden ?? false,
        displayText: override || undefined,
      },
    },
  };
}

export function getPosterPeople(project: PosterProject): PosterPerson[] {
  return project.people.flatMap((person) => {
    const presentation = project.presentation[person.id];
    if (presentation?.hidden) {
      return [];
    }

    return [{
      ...person,
      displayText: presentation?.displayText ?? person.sourceName,
    }];
  });
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function renderPosterSvg(project: PosterProject): string {
  const people = getPosterPeople(project);
  const byId = new Map(people.map((person) => [person.id, person]));
  const depths = new Map<string, number>();

  const depthOf = (person: Person): number => {
    const cached = depths.get(person.id);
    if (cached !== undefined) {
      return cached;
    }
    const parent = person.parentId ? byId.get(person.parentId) : undefined;
    const depth = parent ? depthOf(parent) + 1 : 0;
    depths.set(person.id, depth);
    return depth;
  };

  const rowCounts = new Map<number, number>();
  const positions = new Map<string, { x: number; y: number }>();
  for (const person of people) {
    const depth = depthOf(person);
    const row = rowCounts.get(depth) ?? 0;
    positions.set(person.id, { x: 150 + depth * 240, y: 75 + row * 120 });
    rowCounts.set(depth, row + 1);
  }

  const connectors = people.flatMap((person) => {
    const parentPosition = person.parentId ? positions.get(person.parentId) : undefined;
    const position = positions.get(person.id);
    if (!parentPosition || !position) {
      return [];
    }
    return [
      `<path d="M ${parentPosition.x + 95} ${parentPosition.y + 28} H ${position.x - 20} V ${position.y + 28}" />`,
    ];
  });

  const boxes = people.map((person) => {
    const position = positions.get(person.id);
    if (!position) {
      return '';
    }
    return `<g transform="translate(${position.x} ${position.y})"><rect width="190" height="56" rx="8" /><text x="95" y="34">${escapeXml(person.displayText)}</text></g>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" role="img" aria-label="Family tree poster">
  <rect class="paper" width="1200" height="850" />
  <g class="connectors">${connectors.join('')}</g>
  <g class="people">${boxes.join('')}</g>
</svg>`;
}
