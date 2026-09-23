const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');
const { hasLiveKey } = require('./ai.service');

// ---------------------------------------------------------------------------
// Prompts (used verbatim when a live AI key is configured)
// ---------------------------------------------------------------------------

const PARSE_SYSTEM_PROMPT = [
  'You are a resume parser. Convert raw resume text into a structured JSON object following the provided schema.',
  'Rules:',
  '- Do NOT fabricate facts. Never invent companies, titles, dates, degrees, links, tools, or metrics.',
  '- If a field is missing or uncertain, leave it empty ("") or [].',
  '- Output MUST be valid JSON only (no markdown, no commentary).',
  '- Use concise bullet points for experience and projects.',
  '- Extract skills into grouped arrays when possible.',
  '- Keep everything ATS-friendly and plain text.',
].join('\n');

// Must mirror the app's Resume JSON schema exactly.
const RESUME_SCHEMA_EXAMPLE = {
  title: 'My Resume',
  templateId: 'classic-1',
  targetRole: '',
  jobDescription: '',
  contact: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  experience: [
    {
      company: '',
      role: '',
      location: '',
      start: 'YYYY-MM',
      end: 'YYYY-MM | Present',
      bullets: ['', ''],
      tech: [''],
    },
  ],
  projects: [
    {
      name: '',
      link: '',
      bullets: ['', ''],
      tech: [''],
    },
  ],
  education: [
    {
      school: '',
      degree: '',
      location: '',
      start: 'YYYY',
      end: 'YYYY | Present',
      score: '',
    },
  ],
  skills: {
    languages: [],
    frameworks: [],
    tools: [],
    databases: [],
    other: [],
  },
  certifications: [{ name: '', issuer: '', year: '' }],
  achievements: [''],
};

function buildParseUserPrompt({ targetRole, jobDescription, text }) {
  return `You will be given:

A required JSON schema
Optional target role and job description
Raw resume text extracted from a PDF/DOCX

Return ONLY a JSON object matching the schema exactly.

Schema:
${JSON.stringify(RESUME_SCHEMA_EXAMPLE, null, 2)}

Target role: ${targetRole || 'N/A'}
Job description: ${jobDescription || 'N/A'}

Raw resume text:
"""
${text}
"""

Return JSON only.`;
}

// ---------------------------------------------------------------------------
// Normalization: coerce any parsed object into the exact app schema
// ---------------------------------------------------------------------------

const TEMPLATE_IDS = new Set(['classic-1', 'classic-2', 'compact-1']);

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', sept: '09', oct: '10', nov: '11', dec: '12',
};

function monthNumber(word) {
  const key = String(word || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  return MONTHS[key] || MONTHS[key.slice(0, 3)] || '';
}

// Accepts "2022-03", "Mar 2022", "March 2022", "03/2022", "2022", "Present".
// Anything unrecognizable becomes "" — never invented.
function normalizeDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^(present|current|now|date)$/i.test(raw)) return 'Present';
  let match = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})$/i.exec(raw);
  if (match) {
    const mm = monthNumber(raw);
    return mm ? `${match[1]}-${mm}` : match[1];
  }
  match = /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{2})$/i.exec(raw);
  if (match) {
    const mm = monthNumber(raw);
    return mm ? `20${match[1]}-${mm}` : '';
  }
  match = /^(\d{4})-(\d{1,2})$/.exec(raw);
  if (match) {
    const mm = Number(match[2]);
    return mm >= 1 && mm <= 12 ? `${match[1]}-${String(mm).padStart(2, '0')}` : match[1];
  }
  match = /^(\d{1,2})\/(\d{4})$/.exec(raw);
  if (match) return `${match[2]}-${match[1].padStart(2, '0')}`;
  match = /^\d{4}$/.exec(raw);
  if (match) return raw;
  return '';
}

function normalizeYear(value) {
  const raw = normalizeDate(value);
  if (!raw) return '';
  if (raw === 'Present') return 'Present';
  return /^\d{4}-\d{2}$/.test(raw) ? raw.slice(0, 4) : raw;
}

function asText(value, max) {
  if (value == null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function asTextList(value, max, itemMax) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    const text = asText(item, itemMax);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

function toResumeSchema(parsed, { targetRole, jobDescription } = {}) {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const blank = {
    title: 'My Resume',
    templateId: 'classic-1',
    targetRole: '',
    jobDescription: '',
    contact: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: { languages: [], frameworks: [], tools: [], databases: [], other: [] },
    certifications: [],
    achievements: [],
  };

  const resume = {
    title: asText(source.title, 120) || blank.title,
    templateId: TEMPLATE_IDS.has(source.templateId) ? source.templateId : 'classic-1',
    targetRole: asText(targetRole, 120) || asText(source.targetRole, 120),
    jobDescription: asText(jobDescription, 8000) || asText(source.jobDescription, 8000),
    contact: { ...blank.contact },
    summary: asText(source.summary, 2000),
    experience: [],
    projects: [],
    education: [],
    skills: { ...blank.skills },
    certifications: [],
    achievements: asTextList(source.achievements, 12, 300),
  };

  const contact = source.contact && typeof source.contact === 'object' ? source.contact : {};
  for (const key of Object.keys(blank.contact)) resume.contact[key] = asText(contact[key], key === 'email' ? 120 : 160);

  resume.experience = (Array.isArray(source.experience) ? source.experience : []).slice(0, 12).map((item) => ({
    company: asText(item?.company, 120),
    role: asText(item?.role, 120),
    location: asText(item?.location, 80),
    start: normalizeDate(item?.start),
    end: normalizeDate(item?.end),
    bullets: asTextList(item?.bullets, 12, 500),
    tech: asTextList(item?.tech, 20, 40),
  }));

  resume.projects = (Array.isArray(source.projects) ? source.projects : []).slice(0, 12).map((item) => ({
    name: asText(item?.name, 120),
    link: asText(item?.link, 200),
    bullets: asTextList(item?.bullets, 8, 500),
    tech: asTextList(item?.tech, 20, 40),
  }));

  resume.education = (Array.isArray(source.education) ? source.education : []).slice(0, 8).map((item) => ({
    school: asText(item?.school, 120),
    degree: asText(item?.degree, 120),
    location: asText(item?.location, 80),
    start: normalizeYear(item?.start),
    end: normalizeYear(item?.end),
    score: asText(item?.score, 40),
  }));

  const skills = source.skills && typeof source.skills === 'object' ? source.skills : {};
  for (const key of Object.keys(blank.skills)) {
    resume.skills[key] = asTextList(skills[key], 30, 40);
  }

  resume.certifications = (Array.isArray(source.certifications) ? source.certifications : []).slice(0, 12).map((item) => {
    if (typeof item === 'string') {
      return { name: asText(item, 120), issuer: '', year: normalizeYear(extractYear(item)) };
    }
    return {
      name: asText(item?.name, 120),
      issuer: asText(item?.issuer, 120),
      year: normalizeYear(item?.year) || normalizeYear(extractYear(item?.name)),
    };
  }).filter((item) => item.name || item.issuer);

  return resume;
}

function extractYear(text) {
  const match = /\b((?:19|20)\d{2})\b/.exec(String(text || ''));
  return match ? match[1] : '';
}

// ---------------------------------------------------------------------------
// Live model path
// ---------------------------------------------------------------------------

function parseModelJson(text) {
  const trimmed = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    const error = new Error('Model did not return valid JSON.');
    error.status = 502;
    throw error;
  }
}

async function liveParse({ text, targetRole, jobDescription }) {
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(60000),
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PARSE_SYSTEM_PROMPT },
        { role: 'user', content: buildParseUserPrompt({ targetRole, jobDescription, text }) },
      ],
    }),
  });
  if (!response.ok) {
    const error = new Error(`AI provider returned ${response.status}. Check AI_API_KEY, AI_BASE_URL, and AI_MODEL.`);
    error.status = 502;
    throw error;
  }
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '';
  return parseModelJson(content);
}

// ---------------------------------------------------------------------------
// Local fallback parser (no API key required, never fabricates)
// ---------------------------------------------------------------------------

const BULLET_RE = /^(?:[•▪‣∙◦*+-]|\d+[.)])\s+/;
const DATE_RANGE_RE = new RegExp(
  [
    '((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?\\s*\\d{4}|\\d{1,2}/\\d{4}|\\d{4})',
    '\\s*(?:-|–|—|to|until)\\s*',
    '((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\\.?\\s*\\d{4}|\\d{1,2}/\\d{4}|\\d{4}|Present|Current|Date)',
  ].join(''),
  'i',
);
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;|·]*)?/i;

const SECTION_ALIASES = [
  ['summary', /^(?:summary|professional\s+summary|profile|about(?:\s+me)?|objective|career\s+objective|professional\s+profile)\b/i],
  ['experience', /^(?:exper(?:ience|iences)|work\s+experience|professional\s+experience|employment(?:\s+history)?|work\s+history|career\s+history|relevant\s+experience)\b/i],
  ['projects', /^(?:projects?|personal\s+projects|key\s+projects|selected\s+projects|academic\s+projects)\b/i],
  ['education', /^(?:education|academic(?:\s+background|\s+history|\s+qualifications)?|qualifications|educational\s+background)\b/i],
  ['skills', /^(?:skills|technical\s+skills|skills?\s*(?:&|and)\s*(?:tools|technologies)|technologies|tech(?:nical)?\s+stack|core\s+competencies|competencies)\b/i],
  ['certifications', /^(?:certifications?|certificates?|licen[sc]es?(?:\s*&\s*certifications)?|courses?)\b/i],
  ['achievements', /^(?:achievements?|awards?(?:\s*&\s*achievements)?|accomplishments?|honou?rs|extra[-\s]curricular(?:\s+activities)?)\b/i],
];

function detectHeading(line) {
  const clean = line.trim().replace(/[:：]\s*$/, '');
  if (!clean || clean.length > 48) return null;
  for (const [name, re] of SECTION_ALIASES) {
    const match = re.exec(clean);
    if (match) {
      const rest = clean.slice(match[0].length).replace(/[^a-z&]/gi, '');
      if (rest.length <= 2) return name;
      return null; // e.g. "Skills: React, Node" is content, not a heading
    }
  }
  return null;
}

function splitSections(lines) {
  const sections = { top: [] };
  let current = 'top';
  for (const raw of lines) {
    const line = raw.trim();
    const heading = detectHeading(line);
    if (heading) {
      current = heading;
      sections[current] = sections[current] || [];
      continue;
    }
    (sections[current] = sections[current] || []).push(line);
  }
  return sections;
}

function splitList(text) {
  return String(text || '')
    .split(/[,;·|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikeName(line) {
  const clean = line.trim();
  if (!clean || clean.length > 44 || /\d|@|https?:|www\.|\.com|\.dev|\.io/.test(clean)) return false;
  if (detectHeading(clean)) return false;
  const words = clean.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  return words.every((word) => /^[A-Za-z.'’-]+$/.test(word));
}

function parseContactBlock(topLines) {
  const contact = { name: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' };
  const pool = topLines.filter(Boolean);
  for (const line of pool) {
    if (!contact.name && looksLikeName(line)) {
      contact.name = line.trim();
      continue;
    }
    const email = /[\w.+-]+@[\w-]+\.[\w.-]+/.exec(line);
    if (email && !contact.email) contact.email = email[0];
    const phone = /\+?\d[\d\s().-]{7,}\d/.exec(line);
    if (phone && !contact.phone) {
      const digits = phone[0].replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 13) contact.phone = phone[0].trim();
    }
    const tokens = line.split(/\s*[·|]\s*|\s{2,}/).map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const lower = token.toLowerCase();
      if (/linkedin/.test(lower) && !contact.linkedin) contact.linkedin = token.replace(/^https?:\/\//i, '');
      else if (/github/.test(lower) && !contact.github) contact.github = token.replace(/^https?:\/\//i, '');
      else if (URL_RE.test(token) && /\.[a-z]{2,}/i.test(token) && !/^[\w.+-]+@/.test(token)) {
        if (!contact.portfolio) contact.portfolio = token.replace(/^https?:\/\//i, '');
      } else if (!contact.location && /^[A-Za-z][A-Za-z .'()-]*,\s*[A-Za-z][A-Za-z .'()-]*$/.test(token) && !/\d/.test(token)) {
        contact.location = token;
      }
    }
  }
  return contact;
}

// Entry splitter shared by experience/projects: an entry's header lines come
// first, then bullet lines. Handles both marked bullets ("• ", "-") and text
// layers that lose bullet glyphs entirely (plain sentences after the date).
function splitEntries(lines) {
  const entries = [];
  let current = null;
  let lastWasTech = false;
  const flush = () => {
    if (current && current.header.length) entries.push(current);
    current = null;
    lastWasTech = false;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!current) current = { header: [], bullets: [], tech: [], hasDate: false };
    if (BULLET_RE.test(line)) {
      current.bullets.push(line.replace(BULLET_RE, '').trim());
      lastWasTech = false;
      continue;
    }
    if (/^(?:technolog(?:ies|y)|tech(?:nical)?\s*stack|tech|skills?|stack|environment|tools?)\s*:/i.test(line)) {
      current.tech = splitList(line.replace(/^[^:]+:\s*/, ''));
      lastWasTech = true;
      continue;
    }
    const hasDate = DATE_RANGE_RE.test(line);
    const sentenceish = line.length > 45 || /[.]($|\s)/.test(line) || line.split(/\s+/).length > 6;
    const labelish = /[·|]/.test(line) || !sentenceish;

    if (hasDate && current.hasDate) {
      flush();
      current = { header: [], bullets: [], tech: [], hasDate: false };
    } else if (current.bullets.length) {
      // Plain line after bullets: a new entry only if it looks like a
      // role/company label (or the previous entry ended with a tech line).
      if (labelish || lastWasTech) {
        flush();
        current = { header: [], bullets: [], tech: [], hasDate: false };
      } else {
        current.bullets.push(line);
        lastWasTech = false;
        continue;
      }
    } else if ((current.hasDate || current.header.length >= 2) && sentenceish && !/[·|]/.test(line)) {
      // Glyph-less first bullet right after role/company (or role/company/date).
      current.bullets.push(line);
      lastWasTech = false;
      continue;
    }
    current.header.push(line);
    if (hasDate) current.hasDate = true;
    lastWasTech = false;
  }
  flush();
  return entries;
}

function extractDateRange(headerLines) {
  for (let i = 0; i < headerLines.length; i += 1) {
    const match = DATE_RANGE_RE.exec(headerLines[i]);
    if (match) {
      const start = normalizeDate(match[1]);
      const end = normalizeDate(match[2]);
      const remainder = (headerLines[i].slice(0, match.index) + ' ' + headerLines[i].slice(match.index + match[0].length))
        .replace(/\s*[·|,–—-]\s*$/, '')
        .trim();
      const rest = headerLines.slice(0, i).concat(remainder ? [remainder] : [], headerLines.slice(i + 1));
      return { start, end, rest };
    }
  }
  return { start: '', end: '', rest: headerLines };
}

function parseExperienceSection(lines) {
  return splitEntries(lines)
    .map((entry) => {
      const { start, end, rest } = extractDateRange(entry.header);
      let role = '';
      let company = '';
      let location = '';
      if (rest.length >= 2) {
        role = rest[0];
        const parts = rest[1].split(/\s*[·|]\s*|\s+[—–-]\s+/);
        company = parts[0].trim();
        if (parts.length > 1) location = parts.slice(1).join(', ').trim();
        if (!location && rest[2] && rest[2].length <= 60 && !/[.!?]\s/.test(rest[2])) location = rest[2].trim();
      } else if (rest.length === 1) {
        const parts = rest[0].split(/\s*[·|]\s*|\s+[—–-]\s+|\s+at\s+/i);
        if (parts.length >= 2) {
          role = parts[0].trim();
          company = parts[1].trim();
          if (parts.length > 2) location = parts.slice(2).join(', ').trim();
        } else {
          company = rest[0].trim();
        }
      }
      if (!role && !company && !entry.bullets.length) return null;
      return {
        company,
        role,
        location,
        start,
        end,
        bullets: entry.bullets.filter(Boolean),
        tech: entry.tech.filter(Boolean),
      };
    })
    .filter(Boolean);
}

function parseProjectsSection(lines) {
  return splitEntries(lines)
    .map((entry) => {
      const rest = extractDateRange(entry.header).rest;
      let name = '';
      let link = '';
      const headerParts = [];
      for (const line of rest) {
        const url = URL_RE.exec(line);
        if (url && !link) {
          link = url[0].replace(/^https?:\/\//i, '').replace(/[.,;)]+$/, '');
          const remainder = line.replace(url[0], '').replace(/\s*[·|,(-]+\s*$/, '').replace(/^\)\s*/, '').trim();
          if (remainder) headerParts.push(remainder);
        } else {
          headerParts.push(line);
        }
      }
      name = headerParts[0] || '';
      if (!name && !link && !entry.bullets.length) return null;
      return {
        name,
        link,
        bullets: entry.bullets.filter(Boolean),
        tech: entry.tech.filter(Boolean),
      };
    })
    .filter(Boolean);
}

const DEGREE_RE = /(?:[bm]\.(?:tech|sc|e|com|a|arch)\b\.?|\b(?:b\.?tech|m\.?tech|btech|mtech|barch|bba|mba|bca|mca)\b|bachelor(?:'s)?(?:\s+of.*)?|master(?:'s)?(?:\s+of.*)?|ph\.?d|doctorate|\bdiploma\b|\bhsc\b|\bssc\b|intermediate|class\s*(?:x{1,3}i?|i{1,3}v?|v|i{1,3}|1[0-2])\b|higher\s+secondary|senior\s+secondary|high\s+school|\b12th\b|\b10th\b)/i;

function parseEducationSection(lines) {
  const groups = [];
  let current = null;
  for (const raw of lines) {
    const line = raw.trim().replace(BULLET_RE, '');
    if (!line) continue;
    const hasYear = /(?:19|20)\d{2}|present/i.test(line);
    const isDegree = DEGREE_RE.test(line);
    const shouldSplit =
      current &&
      current.lines.length > 0 &&
      ((hasYear && current.hasYear) || (isDegree && current.isDegree));
    if (shouldSplit) {
      groups.push(current);
      current = null;
    }
    if (!current) current = { lines: [], hasYear: false, isDegree: false };
    current.lines.push(line);
    current.hasYear = current.hasYear || hasYear;
    current.isDegree = current.isDegree || isDegree;
  }
  if (current) groups.push(current);

  return groups.map((group) => {
    let start = '';
    let end = '';
    let score = '';
    const content = [];
    for (const rawLine of group.lines) {
      const line = rawLine.trim();
      if (!line) continue;
      let remainder = line;
      const range = /((?:19|20)\d{2}|Present)\s*(?:-|–|—|to)\s*((?:19|20)\d{2}|Present)/i.exec(line);
      if (range) {
        start = start || normalizeYear(range[1]);
        end = end || normalizeYear(range[2]);
        remainder = (line.slice(0, range.index) + ' ' + line.slice(range.index + range[0].length)).trim();
      } else {
        const years = [...line.matchAll(/\b(?:19|20)\d{2}\b/g)];
        if (years.length) {
          start = start || normalizeYear(years[0][0]);
          end = end || (years[1] ? normalizeYear(years[1][0]) : '');
          remainder = line.replace(/\b(?:19|20)\d{2}\b/g, ' ').trim();
        }
      }
      remainder = remainder.replace(/^[\s·|,–—-]+|[\s·|,–—-]+$/g, '').trim();
      if (!remainder) continue;
      const scoreMatch = /((?:cgpa|gpa)\s*:?\s*\d+(?:\.\d+)?(?:\s*\/\s*\d+)?|\d+(?:\.\d+)?\s*(?:cgpa|gpa)|\d+(?:\.\d+)?\s*%)/i.exec(remainder);
      if (scoreMatch && !DEGREE_RE.test(remainder)) {
        score = scoreMatch[0].trim();
        continue;
      }
      content.push(remainder);
    }

    let school = '';
    let degree = '';
    let location = '';
    const degreeLine = content.find((line) => DEGREE_RE.test(line));
    const others = content.filter((line) => line !== degreeLine);
    if (degreeLine) {
      if ((degreeLine.match(/,/g) || []).length >= 2 && !school) {
        const idx = degreeLine.lastIndexOf(', ');
        degree = degreeLine.slice(0, idx).trim();
        school = degreeLine.slice(idx + 2).trim();
      } else {
        degree = degreeLine;
      }
    }
    if (others.length) {
      const parts = others[0].split(/\s*[·|]\s*|\s+[—–-]\s+/);
      if (parts.length > 1) {
        school = school || parts[0].trim();
        location = location || parts.slice(1).join(', ').trim();
      } else if (school) {
        location = location || others[0].trim();
      } else {
        school = others[0].trim();
        if (others[1]) location = others[1].trim();
      }
    }
    return {
      school,
      degree,
      location,
      start,
      end,
      score,
    };
  }).filter((item) => item.school || item.degree || item.start || item.end);
}

const SKILL_GROUP_ALIASES = {
  languages: ['language', 'languages', 'programming languages', 'programming', 'coding'],
  frameworks: ['frameworks', 'framework', 'frameworks & libraries', 'libraries', 'frontend', 'front-end', 'front end', 'backend', 'back-end', 'back end', 'web technologies', 'technologies'],
  tools: ['tools', 'tool', 'tools & platforms', 'platforms', 'devops', 'cloud', 'software', 'developer tools', 'editor', 'ides'],
  databases: ['databases', 'database', 'data stores', 'db', 'dbs'],
  other: ['other', 'misc', 'miscellaneous', 'additional', 'competencies', 'core competencies', 'interests', 'strengths', 'practices', 'methodologies'],
};

function parseSkillsSection(lines) {
  const skills = { languages: [], frameworks: [], tools: [], databases: [], other: [] };
  const pushAll = (key, values) => {
    const seen = new Set(skills[key].map((v) => v.toLowerCase()));
    for (const value of values) {
      const clean = value.trim().replace(/^[-•*]\s*/, '');
      if (!clean || clean.length > 60) continue;
      const keyLower = clean.toLowerCase();
      if (seen.has(keyLower)) continue;
      seen.add(keyLower);
      skills[key].push(clean);
      if (skills[key].length >= 30) return;
    }
  };
  let groupForUnlabeled = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const labeled = /^([a-z][a-z &/'-]{1,40}):\s*(.+)$/i.exec(line);
    if (labeled) {
      const label = labeled[1].trim().toLowerCase();
      const values = splitList(labeled[2]);
      let matched = false;
      for (const [key, aliases] of Object.entries(SKILL_GROUP_ALIASES)) {
        if (aliases.some((alias) => label === alias || label.replace(/s$/, '') === alias.replace(/s$/, ''))) {
          pushAll(key, values);
          groupForUnlabeled = key;
          matched = true;
          break;
        }
      }
      if (!matched) {
        pushAll('other', values);
        groupForUnlabeled = 'other';
      }
      continue;
    }
    const values = splitList(line).length > 1 ? splitList(line) : [line.replace(/^[-•*]\s*/, '')];
    pushAll(groupForUnlabeled || 'other', values);
  }
  return skills;
}

function parseCertificationsSection(lines) {
  return lines.map((raw) => {
    const line = raw.trim().replace(BULLET_RE, '');
    if (!line) return null;
    const parts = line.split(/\s*[·|—–]\s*|\s+-\s+|\s*,\s*/).map((p) => p.trim()).filter(Boolean);
    const year = extractYear(line);
    const name = parts[0] || line;
    const issuer = parts.slice(1).find((p) => !/^(?:19|20)\d{2}$/.test(p) && p !== name) || '';
    if (!name && !issuer) return null;
    return { name, issuer, year };
  }).filter(Boolean);
}

function localParseResume(rawText) {
  const text = String(rawText || '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n').map((line) => line.trim());
  const sections = splitSections(lines);
  const contact = parseContactBlock(sections.top);
  const experience = parseExperienceSection(sections.experience || []);
  const projects = parseProjectsSection(sections.projects || []);
  const education = parseEducationSection(sections.education || []);
  const skills = parseSkillsSection(sections.skills || []);
  const certifications = parseCertificationsSection(sections.certifications || []);
  const achievements = (sections.achievements || [])
    .map((line) => line.replace(BULLET_RE, '').trim())
    .filter(Boolean);
  const summary = (sections.summary || []).filter(Boolean).join(' ').trim();

  const warnings = [];
  if (!experience.length && !projects.length && !education.length && !summary) {
    warnings.push('The local parser could not detect standard sections. Review every field before exporting.');
  }
  if ((sections.experience || []).length && !experience.length) {
    warnings.push('Experience entries were hard to recognize; fill in roles by hand.');
  }
  return toResumeSchema(
    { title: 'My Resume', templateId: 'classic-1', contact, summary, experience, projects, education, skills, certifications, achievements },
    {},
  );
}

// ---------------------------------------------------------------------------
// Entry point: file buffer -> { resumeData, warnings }
// ---------------------------------------------------------------------------

const MAX_TEXT_CHARS = 20000;

function htmlToText(html) {
  return String(html || '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(?:p|h[1-6]|ul|ol|li|table|tr|div|blockquote|section|article|header|footer)>/gi, '\n')
    .replace(/<(?:p|h[1-6]|table|tr|div|blockquote|section|article|header|footer)[^>]*>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

async function extractText(buffer, kind) {
  if (kind === 'pdf') {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return String(result.text || '').replace(/^--\s*\d+\s+of\s+\d+\s*--\s*$/gm, '');
    } finally {
      await parser.destroy().catch(() => {});
    }
  }
  // convertToHtml keeps list markers (numbering lives in styles, not text),
  // so DOCX bullets survive as "• " lines.
  try {
    const { value } = await mammoth.convertToHtml({ buffer });
    const text = htmlToText(value);
    if (text.trim()) return text;
  } catch (error) {
    // fall through to plain extraction
  }
  const { value } = await mammoth.extractRawText({ buffer });
  return value || '';
}

async function parseResumeFile({ buffer, kind, targetRole, jobDescription }) {
  let text = await extractText(buffer, kind);
  text = text.replace(/\r\n?/g, '\n').trim();
  if (!text) {
    const error = new Error('No readable text found in this file. Scanned image PDFs are not supported — paste the content manually.');
    error.status = 422;
    throw error;
  }

  const warnings = [];
  if (text.length > MAX_TEXT_CHARS) {
    text = text.slice(0, MAX_TEXT_CHARS).replace(/\s+\S*$/, '').trim();
    warnings.push(`Resume text was longer than ${MAX_TEXT_CHARS} characters, so it was truncated. Later sections may be missing.`);
  }

  let parsed;
  let usedLocal = true;
  if (hasLiveKey()) {
    try {
      parsed = await liveParse({ text, targetRole, jobDescription });
      usedLocal = false;
    } catch (error) {
      warnings.push('The live model could not parse this file, so the built-in local parser was used.');
      if ((error.status || 500) >= 500) console.error(error);
    }
  }
  if (usedLocal) {
    if (!hasLiveKey()) warnings.push('Local parser is active. Set AI_API_KEY to use a live model for higher-quality parsing.');
    parsed = localParseResume(text);
  }

  const resumeData = toResumeSchema(parsed, { targetRole, jobDescription });
  if (!resumeData.contact.name) warnings.push('No name was detected. Add it in the Contact section.');
  if (!resumeData.experience.length && !resumeData.projects.length && !resumeData.education.length) {
    warnings.push('No experience, project, or education entries were detected. Check each section and fill gaps by hand.');
  }

  return { resumeData, warnings };
}

module.exports = {
  PARSE_SYSTEM_PROMPT,
  RESUME_SCHEMA_EXAMPLE,
  buildParseUserPrompt,
  normalizeDate,
  toResumeSchema,
  localParseResume,
  parseResumeFile,
};
