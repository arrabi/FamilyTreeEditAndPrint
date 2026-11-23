export interface Person {
  id: string;
  parentId?: string;
  name: string;
}

const SAMPLE_NAMES = [
  'Sami نهر 001',
  'Layla نور 002',
  'Omar ريح 003',
  'Mira غيم 004',
  'Jad ليل 005',
  'Rana شجر 006',
  'Nour رمل 007',
  'Faris بحر 008',
];

export function fictionalFiveGenerationTree(): Person[] {
  const generationSizes = [1, 3, 10, 35, 97];
  const people: Person[] = [];

  generationSizes.forEach((size, generation) => {
    const previousStart = people.length - (generation > 0 ? generationSizes[generation - 1] : 0);
    for (let index = 0; index < size; index += 1) {
      const number = people.length + 1;
      const parentId = generation === 0
        ? undefined
        : people[previousStart + Math.floor(index * generationSizes[generation - 1] / size)]?.id;
      people.push({
        id: `person-${number}`,
        parentId,
        name: SAMPLE_NAMES[(number - 1) % SAMPLE_NAMES.length].replace(/\d{3}/, String(number).padStart(3, '0')),
      });
    }
  });

  return people;
}
