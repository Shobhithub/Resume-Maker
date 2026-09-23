import { cleanList, contactParts, formatRange, hasText, skillsLines, visibleSections } from '../utils/text';

export function ResumeHeader({ resume, centered = false }) {
  const parts = contactParts(resume.contact);
  return (
    <header className="rs-header">
      {hasText(resume.contact?.name) && <h1>{resume.contact.name.trim()}</h1>}
      {parts.length > 0 && (
        <p className="rs-contact" style={centered ? undefined : undefined}>
          {parts.join(' · ')}
        </p>
      )}
    </header>
  );
}

export function SummaryBlock({ summary }) {
  if (!hasText(summary)) return null;
  return (
    <section>
      <h2>Summary</h2>
      <p className="rs-summary">{summary.trim()}</p>
    </section>
  );
}

export function BulletList({ bullets }) {
  const items = cleanList(bullets);
  if (!items.length) return null;
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
      ))}
    </ul>
  );
}

export function TechLine({ tech }) {
  const items = cleanList(tech);
  if (!items.length) return null;
  return <p className="rs-tech">Technologies: {items.join(', ')}</p>;
}

export function SkillsBlock({ skills }) {
  const lines = skillsLines(skills);
  if (!lines.length) return null;
  return (
    <section>
      <h2>Skills</h2>
      <div className="rs-skills">
        {lines.map((line) => (
          <p key={line.label}>
            <strong>{line.label}: </strong>
            {line.items.join(', ')}
          </p>
        ))}
      </div>
    </section>
  );
}

export function CertificationsBlock({ items }) {
  const filled = (items || []).filter((item) => hasText(item.name) || hasText(item.issuer) || hasText(item.year));
  if (!filled.length) return null;
  return (
    <section>
      <h2>Certifications</h2>
      {filled.map((item, index) => {
        const detail = [item.issuer, item.year].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
        return (
          <p className="cert" key={`${item.name}-${index}`}>
            <strong>{item.name || 'Certification'}</strong>
            {detail ? ` — ${detail}` : ''}
          </p>
        );
      })}
    </section>
  );
}

export function AchievementsBlock({ items }) {
  const filled = cleanList(items);
  if (!filled.length) return null;
  return (
    <section>
      <h2>Achievements</h2>
      <ul>
        {filled.map((item, index) => (
          <li key={`${index}-${item.slice(0, 24)}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function useVisibility(resume) {
  return visibleSections(resume || {});
}

export function Dates({ start, end }) {
  const label = formatRange(start, end);
  if (!label) return null;
  return <p className="entry-dates">{label}</p>;
}
