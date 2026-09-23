import { SkillInput } from './fields';

const GROUPS = [
  ['skills.languages', 'Languages'],
  ['skills.frameworks', 'Frameworks'],
  ['skills.tools', 'Tools'],
  ['skills.databases', 'Databases'],
  ['skills.other', 'Other'],
];

export function SkillsSection() {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-mute">
        List only skills you can discuss. They render as plain labeled lines, not bars or icons.
      </p>
      {GROUPS.map(([name, label]) => (
        <SkillInput key={name} name={name} label={label} />
      ))}
    </div>
  );
}
