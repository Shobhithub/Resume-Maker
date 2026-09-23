import { Classic1 } from './classic-1';
import { Classic2 } from './classic-2';
import { Compact1 } from './compact-1';

export const templates = [
  {
    id: 'classic-1',
    name: 'Classic',
    font: 'Calibri',
    description: 'Centered name, ruled headings, room to read.',
    Component: Classic1,
  },
  {
    id: 'classic-2',
    name: 'Traditional',
    font: 'Times',
    description: 'Serif, left-aligned, formal structure.',
    Component: Classic2,
  },
  {
    id: 'compact-1',
    name: 'Compact',
    font: 'Arial',
    description: 'Tighter leading so more fits on one page.',
    Component: Compact1,
  },
];

export function getTemplate(id) {
  return templates.find((template) => template.id === id) || templates[0];
}
