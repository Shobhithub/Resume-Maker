const {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} = require('docx');
const { cleanList, contactParts, formatRange, hasText, skillsLines } = require('../utils/format');

const PRESETS = {
  'classic-1': {
    font: 'Calibri',
    nameSize: 40,
    headingSize: 22,
    bodySize: 21,
    contactAlign: AlignmentType.CENTER,
    nameAlign: AlignmentType.CENTER,
    headingCaps: true,
    italicRole: false,
    before: 240,
    afterEntry: 80,
  },
  'classic-2': {
    font: 'Times New Roman',
    nameSize: 44,
    headingSize: 24,
    bodySize: 22,
    contactAlign: AlignmentType.LEFT,
    nameAlign: AlignmentType.LEFT,
    headingCaps: false,
    italicRole: true,
    before: 260,
    afterEntry: 80,
  },
  'compact-1': {
    font: 'Arial',
    nameSize: 32,
    headingSize: 20,
    bodySize: 19,
    contactAlign: AlignmentType.LEFT,
    nameAlign: AlignmentType.LEFT,
    headingCaps: true,
    italicRole: false,
    before: 160,
    afterEntry: 40,
  },
};

function run(text, options) {
  return new TextRun({ text: text || '', ...options });
}

function heading(text, preset) {
  const label = text;
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: preset.before, after: 60 },
    border: {
      bottom: { color: '1A1A1A', space: 1, style: BorderStyle.SINGLE, size: preset.font === 'Times New Roman' ? 12 : 6 },
    },
    children: [
      run(label, {
        bold: true,
        font: preset.font,
        size: preset.headingSize,
        color: '1A1A1A',
      }),
    ],
  });
}

function bodyPara(children, preset, extra = {}) {
  return new Paragraph({
    spacing: { after: extra.after ?? 40 },
    alignment: extra.alignment,
    children: children.map((child) =>
      child instanceof TextRun
        ? child
        : run(child.text, { font: preset.font, size: preset.bodySize, ...child }),
    ),
  });
}

function bullet(text, preset) {
  return new Paragraph({
    numbering: { reference: 'resume-bullets', level: 0 },
    spacing: { after: 20 },
    children: [run(text, { font: preset.font, size: preset.bodySize })],
  });
}

function experienceBlocks(resume, preset, templateId) {
  const items = (resume.experience || []).filter(
    (item) =>
      ['company', 'role', 'location', 'start', 'end'].some((key) => hasText(item[key])) ||
      cleanList(item.bullets).length ||
      cleanList(item.tech).length,
  );
  if (!items.length) return [];
  const blocks = [heading('Experience', preset)];
  items.forEach((item) => {
    const dates = formatRange(item.start, item.end);
    let primary = item.role || 'Role';
    let secondary = [item.company, item.location].filter(hasText).join(' · ');
    if (templateId === 'classic-2') {
      primary = [item.role, item.company].filter(hasText).join(', ') || 'Role';
      secondary = item.location || '';
    }
    if (templateId === 'compact-1') {
      primary = [item.role, item.company, item.location].filter(hasText).join(', ') || 'Role';
      secondary = '';
    }
    const children = [
      run(primary, {
        bold: true,
        italics: preset.italicRole,
        font: preset.font,
        size: preset.bodySize,
      }),
    ];
    if (dates) {
      children.push(run(`    ${dates}`, { font: preset.font, size: preset.bodySize }));
    }
    blocks.push(new Paragraph({ spacing: { before: 80, after: 20 }, children }));
    if (secondary) {
      blocks.push(bodyPara([{ text: secondary }], preset, { after: 20 }));
    }
    cleanList(item.bullets).forEach((line) => blocks.push(bullet(line, preset)));
    const tech = cleanList(item.tech);
    if (tech.length) {
      blocks.push(bodyPara([{ text: `Technologies: ${tech.join(', ')}` }], preset, { after: preset.afterEntry }));
    }
  });
  return blocks;
}

function projectBlocks(resume, preset, templateId) {
  const items = (resume.projects || []).filter(
    (item) => hasText(item.name) || hasText(item.link) || cleanList(item.bullets).length || cleanList(item.tech).length,
  );
  if (!items.length) return [];
  const blocks = [heading('Projects', preset)];
  items.forEach((item) => {
    const sep = templateId === 'classic-1' ? ' ' : ' — ';
    const title = [item.name, item.link].filter(hasText).join(sep) || 'Project';
    blocks.push(
      new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [run(title, { bold: true, italics: preset.italicRole, font: preset.font, size: preset.bodySize })],
      }),
    );
    cleanList(item.bullets).forEach((line) => blocks.push(bullet(line, preset)));
    const tech = cleanList(item.tech);
    if (tech.length) blocks.push(bodyPara([{ text: `Technologies: ${tech.join(', ')}` }], preset));
  });
  return blocks;
}

function educationBlocks(resume, preset, templateId) {
  const items = (resume.education || []).filter((item) =>
    ['school', 'degree', 'location', 'start', 'end', 'score'].some((key) => hasText(item[key])),
  );
  if (!items.length) return [];
  const blocks = [heading('Education', preset)];
  items.forEach((item) => {
    const dates = formatRange(item.start, item.end);
    let primary = [item.degree, item.school].filter(hasText).join(', ') || item.school || 'Education';
    if (templateId === 'compact-1') {
      primary = [item.degree, item.school, item.location].filter(hasText).join(', ') || 'Education';
      if (hasText(item.score)) primary += ` (${item.score.trim()})`;
    }
    const children = [run(primary, { bold: true, font: preset.font, size: preset.bodySize })];
    if (dates) children.push(run(`    ${dates}`, { font: preset.font, size: preset.bodySize }));
    blocks.push(new Paragraph({ spacing: { before: 80, after: 20 }, children }));
    if (templateId !== 'compact-1' && hasText(item.location)) {
      blocks.push(bodyPara([{ text: item.location.trim() }], preset, { after: 20 }));
    }
    if (templateId !== 'compact-1' && hasText(item.score)) {
      blocks.push(bodyPara([{ text: item.score.trim() }], preset));
    }
  });
  return blocks;
}

function skillBlocks(resume, preset) {
  const lines = skillsLines(resume.skills);
  if (!lines.length) return [];
  const blocks = [heading('Skills', preset)];
  lines.forEach((line) => {
    blocks.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [
          run(`${line.label}: `, { bold: true, font: preset.font, size: preset.bodySize }),
          run(line.items.join(', '), { font: preset.font, size: preset.bodySize }),
        ],
      }),
    );
  });
  return blocks;
}

function certificationBlocks(resume, preset) {
  const items = (resume.certifications || []).filter((item) => hasText(item.name) || hasText(item.issuer) || hasText(item.year));
  if (!items.length) return [];
  const blocks = [heading('Certifications', preset)];
  items.forEach((item) => {
    const detail = [item.issuer, item.year].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
    blocks.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          run(item.name || 'Certification', { bold: true, font: preset.font, size: preset.bodySize }),
          detail ? run(` — ${detail}`, { font: preset.font, size: preset.bodySize }) : run('', { font: preset.font, size: preset.bodySize }),
        ],
      }),
    );
  });
  return blocks;
}

function achievementBlocks(resume, preset) {
  const items = cleanList(resume.achievements);
  if (!items.length) return [];
  return [heading('Achievements', preset), ...items.map((item) => bullet(item, preset))];
}

async function renderDocx(resume, templateId) {
  const id = PRESETS[templateId] ? templateId : 'classic-1';
  const preset = PRESETS[id];
  const name = hasText(resume.contact?.name) ? resume.contact.name.trim() : resume.title || 'Resume';
  const contact = contactParts(resume.contact).join(' · ');
  const children = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: preset.nameAlign,
      spacing: { after: 40 },
      children: [run(name, { bold: true, font: preset.font, size: preset.nameSize, color: '1A1A1A' })],
    }),
  ];

  if (contact) {
    children.push(
      new Paragraph({
        alignment: preset.contactAlign,
        spacing: { after: 80 },
        children: [run(contact, { font: preset.font, size: Math.max(preset.bodySize - 1, 16) })],
      }),
    );
  }

  if (hasText(resume.summary)) {
    children.push(heading('Summary', preset));
    resume.summary
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .forEach((paragraph) => {
        children.push(bodyPara([{ text: paragraph.trim() }], preset, { after: 60 }));
      });
  }

  children.push(
    ...experienceBlocks(resume, preset, id),
    ...projectBlocks(resume, preset, id),
    ...educationBlocks(resume, preset, id),
    ...skillBlocks(resume, preset),
    ...certificationBlocks(resume, preset),
    ...achievementBlocks(resume, preset),
  );

  const doc = new Document({
    creator: 'Plainpage',
    title: resume.title || name,
    description: 'ATS-friendly resume',
    styles: {
      default: {
        document: {
          run: { font: preset.font, size: preset.bodySize },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'resume-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 420, hanging: 220 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: id === 'compact-1' ? 620 : 860,
              bottom: id === 'compact-1' ? 620 : 860,
              left: id === 'compact-1' ? 720 : 980,
              right: id === 'compact-1' ? 720 : 980,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { renderDocx };
