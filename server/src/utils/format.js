const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function hasText(value) {
  return Boolean(value && String(value).trim());
}

function cleanList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function formatMonth(value) {
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

function formatRange(start, end) {
  const left = formatMonth(start);
  const right = formatMonth(end);
  if (left && right) return `${left} – ${right}`;
  return left || right || '';
}

function contactParts(contact = {}) {
  return [contact.email, contact.phone, contact.location, contact.linkedin, contact.github, contact.portfolio]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
}

function skillsLines(skills = {}) {
  return [
    ['languages', 'Languages'],
    ['frameworks', 'Frameworks'],
    ['tools', 'Tools'],
    ['databases', 'Databases'],
    ['other', 'Other'],
  ]
    .map(([key, label]) => {
      const items = cleanList(skills[key]);
      return items.length ? { label, items } : null;
    })
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeFileBase(name) {
  const base = String(name || 'resume')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'resume';
}

function contentDisposition(filename) {
  const ascii = filename.replace(/[^\x20-\x7E]/g, '') || 'resume';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

module.exports = {
  hasText,
  cleanList,
  formatMonth,
  formatRange,
  contactParts,
  skillsLines,
  escapeHtml,
  safeFileBase,
  contentDisposition,
};
