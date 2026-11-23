import type { PosterDocument } from './model.ts';

export const fictionalPoster: PosterDocument = {
  title: 'The Haddad family',
  page: {
    format: 'A3',
    orientation: 'landscape',
    bleedMm: 3,
    marginMm: 15,
    cropMarks: true,
  },
  people: [
    { id: 'root', name: 'Yusuf Haddad', x: 360, y: 132, width: 40, direction: 'ltr' },
    {
      id: 'sami',
      parentId: 'root',
      name: 'Salim Haddad',
      displayText: 'سليم حداد',
      x: 280,
      y: 83,
      width: 38,
      direction: 'rtl',
    },
    {
      id: 'mariam',
      parentId: 'root',
      name: 'Mariam Haddad',
      displayText: 'مريم Haddad',
      x: 278,
      y: 180,
      width: 46,
      direction: 'rtl',
    },
    { id: 'nadia', parentId: 'sami', name: 'Nadia Haddad', x: 180, y: 58, width: 40 },
    { id: 'hidden', parentId: 'mariam', name: 'Hidden fictional person', x: 177, y: 205, hidden: true },
  ],
  connections: [
    { from: 'root', to: 'sami' },
    { from: 'root', to: 'mariam' },
    { from: 'sami', to: 'nadia' },
    { from: 'mariam', to: 'hidden' },
  ],
  freeText: [
    { id: 'title', text: 'Haddad Family · عائلة حداد', x: 210, y: 38, fontSize: 8, direction: 'ltr' },
    { id: 'subtitle', text: 'A fictional family tree for print testing', x: 210, y: 52, fontSize: 3.4 },
  ],
};
