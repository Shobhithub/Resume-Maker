const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function hasText(value) {
  return Boolean(value && String(value).trim());
}

export function cleanList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item ?? '').trim()).filter(Boolean);
}

export function splitList(text) {
  return String(text ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatMonth(value) {
  if (!hasText(value)) return '';
  const raw = String(value).trim();
  if (/^present$/i.test(raw)) return 'Present';
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (match) {
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${match[1]}`;
  }
  return raw;
}

export function formatRange(start, end) {
  const left = formatMonth(start);
  const right = formatMonth(end);
  if (left && right) return `${left} – ${right}`;
  return left || right || '';
}

export function contactParts(contact = {}) {
  return [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedin,
    contact.github,
    contact.portfolio,
  ]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

export function skillsLines(skills = {}) {
  const labels = [
    ['languages', 'Languages'],
    ['frameworks', 'Frameworks'],
    ['tools', 'Tools'],
    ['databases', 'Databases'],
    ['other', 'Other'],
  ];
  return labels
    .map(([key, label]) => {
      const items = cleanList(skills[key]);
      if (!items.length) return null;
      return { label, items };
    })
    .filter(Boolean);
}

export function collectSkills(resume) {
  const skills = resume?.skills || {};
  const fromRoles = (resume?.experience || []).flatMap((item) => item.tech || []);
  const fromProjects = (resume?.projects || []).flatMap((item) => item.tech || []);
  return cleanList([
    ...Object.values(skills).flat(),
    ...fromRoles,
    ...fromProjects,
  ]);
}

export function safeFileName(name) {
  const base = String(name || 'resume')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'resume';
}

export function entryHasContent(entry, keys) {
  if (!entry) return false;
  return keys.some((key) => {
    const value = entry[key];
    if (Array.isArray(value)) return cleanList(value).length > 0;
    return hasText(value);
  });
}

export function visibleSections(resume) {
  return {
    summary: hasText(resume.summary),
    experience: (resume.experience || []).some((item) =>
      entryHasContent(item, ['company', 'role', 'location', 'start', 'end', 'bullets', 'tech']),
    ),
    projects: (resume.projects || []).some((item) =>
      entryHasContent(item, ['name', 'link', 'bullets', 'tech']),
    ),
    education: (resume.education || []).some((item) =>
      entryHasContent(item, ['school', 'degree', 'location', 'start', 'end', 'score']),
    ),
    skills: skillsLines(resume.skills).length > 0,
    certifications: (resume.certifications || []).some((item) =>
      entryHasContent(item, ['name', 'issuer', 'year']),
    ),
    achievements: cleanList(resume.achievements).length > 0,
  };
}

export function countFilled(list, predicate) {
  return (list || []).filter(predicate).length;
}
