const fs = require('fs');
const path = require('path');
const {
  cleanList,
  contactParts,
  escapeHtml,
  formatRange,
  hasText,
  skillsLines,
} = require('../utils/format');

const cssPath = path.join(__dirname, '../../../client/src/templates/templateStyles.css');

function loadCss() {
  try {
    return fs.readFileSync(cssPath, 'utf8');
  } catch (error) {
    console.error('Could not read template CSS', error.message);
    return '';
  }
}

function bulletsHtml(bullets) {
  const items = cleanList(bullets);
  if (!items.length) return '';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function techHtml(tech) {
  const items = cleanList(tech);
  if (!items.length) return '';
  return `<p class="rs-tech">Technologies: ${escapeHtml(items.join(', '))}</p>`;
}

function datesHtml(start, end) {
  const label = formatRange(start, end);
  if (!label) return '';
  return `<p class="entry-dates">${escapeHtml(label)}</p>`;
}

function summaryHtml(summary) {
  if (!hasText(summary)) return '';
  return `<section><h2>Summary</h2><p class="rs-summary">${escapeHtml(summary.trim())}</p></section>`;
}

function skillsHtml(skills) {
  const lines = skillsLines(skills);
  if (!lines.length) return '';
  return `<section><h2>Skills</h2><div class="rs-skills">${lines
    .map((line) => `<p><strong>${escapeHtml(line.label)}: </strong>${escapeHtml(line.items.join(', '))}</p>`)
    .join('')}</div></section>`;
}

function certificationsHtml(items) {
  const filled = (items || []).filter((item) => hasText(item.name) || hasText(item.issuer) || hasText(item.year));
  if (!filled.length) return '';
  return `<section><h2>Certifications</h2>${filled
    .map((item) => {
      const detail = [item.issuer, item.year].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
      return `<p class="cert"><strong>${escapeHtml(item.name || 'Certification')}</strong>${
        detail ? ` — ${escapeHtml(detail)}` : ''
      }</p>`;
    })
    .join('')}</section>`;
}

function achievementsHtml(items) {
  const filled = cleanList(items);
  if (!filled.length) return '';
  return `<section><h2>Achievements</h2><ul>${filled.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
}

function experienceHtml(resume, variant) {
  const items = (resume.experience || []).filter((item) =>
    ['company', 'role', 'location', 'start', 'end'].some((key) => hasText(item[key])) ||
    cleanList(item.bullets).length ||
    cleanList(item.tech).length,
  );
  if (!items.length) return '';
  const body = items
    .map((item) => {
      let title = '';
      if (variant === 'classic-2') {
        const headline = [item.role, item.company].filter(hasText).join(', ') || 'Role';
        title = `<span class="role">${escapeHtml(headline)}</span>${
          hasText(item.location) ? `<span class="org"> — ${escapeHtml(item.location.trim())}</span>` : ''
        }`;
      } else if (variant === 'compact-1') {
        const headline = [item.role, item.company, item.location].filter(hasText).join(', ') || 'Role';
        title = `<span class="role">${escapeHtml(headline)}</span>`;
      } else {
        const org = [item.company, item.location].filter(hasText).join(' · ');
        title = `<span class="role">${escapeHtml(item.role || 'Role')}</span>${
          org ? `<span class="org">${escapeHtml(org)}</span>` : ''
        }`;
      }
      return `<div class="entry"><div class="entry-head"><p class="entry-title">${title}</p>${datesHtml(
        item.start,
        item.end,
      )}</div>${bulletsHtml(item.bullets)}${techHtml(item.tech)}</div>`;
    })
    .join('');
  return `<section><h2>Experience</h2>${body}</section>`;
}

function projectsHtml(resume, variant) {
  const items = (resume.projects || []).filter(
    (item) => hasText(item.name) || hasText(item.link) || cleanList(item.bullets).length || cleanList(item.tech).length,
  );
  if (!items.length) return '';
  const body = items
    .map((item) => {
      let title = '';
      if (variant === 'compact-1') {
        title = `<span class="role">${escapeHtml([item.name, item.link].filter(hasText).join(' — ') || 'Project')}</span>`;
      } else if (variant === 'classic-2') {
        title = `<span class="role">${escapeHtml(item.name || 'Project')}</span>${
          hasText(item.link) ? `<span class="org"> — ${escapeHtml(item.link.trim())}</span>` : ''
        }`;
      } else {
        title = `<span class="role">${escapeHtml(item.name || 'Project')}</span>${
          hasText(item.link) ? `<span class="org">${escapeHtml(item.link.trim())}</span>` : ''
        }`;
      }
      const head =
        variant === 'classic-1'
          ? `<div class="entry-head"><p class="entry-title">${title}</p></div>`
          : `<p class="entry-title">${title}</p>`;
      return `<div class="entry">${head}${bulletsHtml(item.bullets)}${techHtml(item.tech)}</div>`;
    })
    .join('');
  return `<section><h2>Projects</h2>${body}</section>`;
}

function educationHtml(resume, variant) {
  const items = (resume.education || []).filter((item) =>
    ['school', 'degree', 'location', 'start', 'end', 'score'].some((key) => hasText(item[key])),
  );
  if (!items.length) return '';
  const body = items
    .map((item) => {
      if (variant === 'compact-1') {
        const headline = [item.degree, item.school, item.location].filter(hasText).join(', ') || 'Education';
        const score = hasText(item.score) ? ` (${item.score.trim()})` : '';
        return `<div class="entry"><div class="entry-head"><p class="entry-title"><span class="role">${escapeHtml(
          headline + score,
        )}</span></p>${datesHtml(item.start, item.end)}</div></div>`;
      }
      if (variant === 'classic-2') {
        const headline = [item.degree, item.school].filter(hasText).join(', ') || 'Education';
        return `<div class="entry"><div class="entry-head"><p class="entry-title"><span class="role">${escapeHtml(
          headline,
        )}</span>${hasText(item.location) ? `<span class="org"> — ${escapeHtml(item.location.trim())}</span>` : ''}</p>${datesHtml(
          item.start,
          item.end,
        )}</div>${hasText(item.score) ? `<p class="score">${escapeHtml(item.score.trim())}</p>` : ''}</div>`;
      }
      const org = [item.degree ? item.school : '', item.location].filter(hasText).join(' · ');
      return `<div class="entry"><div class="entry-head"><p class="entry-title"><span class="role">${escapeHtml(
        item.degree || item.school || 'Education',
      )}</span>${org ? `<span class="org">${escapeHtml(org)}</span>` : ''}</p>${datesHtml(item.start, item.end)}</div>${
        hasText(item.score) ? `<p class="score">${escapeHtml(item.score.trim())}</p>` : ''
      }</div>`;
    })
    .join('');
  return `<section><h2>Education</h2>${body}</section>`;
}

function headerHtml(resume) {
  const name = hasText(resume.contact?.name) ? `<h1>${escapeHtml(resume.contact.name.trim())}</h1>` : '';
  const parts = contactParts(resume.contact);
  const contact = parts.length ? `<p class="rs-contact">${escapeHtml(parts.join(' · '))}</p>` : '';
  return `<header class="rs-header">${name}${contact}</header>`;
}

function renderResumeHtml(resume, templateId) {
  const id = ['classic-1', 'classic-2', 'compact-1'].includes(templateId) ? templateId : 'classic-1';
  const body = [
    headerHtml(resume),
    summaryHtml(resume.summary),
    experienceHtml(resume, id),
    projectsHtml(resume, id),
    educationHtml(resume, id),
    skillsHtml(resume.skills),
    certificationsHtml(resume.certifications),
    achievementsHtml(resume.achievements),
  ].join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(resume.contact?.name || resume.title || 'Resume')}</title>
  <style>
    @page { size: letter; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    ${loadCss()}
  </style>
</head>
<body>
  <main class="resume-page ${id === 'classic-1' ? 'rs-classic-1' : id === 'classic-2' ? 'rs-classic-2' : 'rs-compact-1'}">${body}</main>
</body>
</html>`;
}

module.exports = { renderResumeHtml };
