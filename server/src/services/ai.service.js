const SYSTEM_PROMPT = `You are an ATS resume rewriting assistant. Your job is to rewrite user-provided resume text to be clearer, stronger, and ATS-friendly while preserving truthfulness.
Rules:

Do NOT fabricate facts: do not invent companies, job titles, dates, degrees, tools, certifications, numbers, or metrics.
If the user did not provide metrics, you may suggest a placeholder metric format like "(e.g., reduced latency by X%)" but must not claim an actual number.
Keep language professional, concise, and scannable.
For bullets, use an action verb, include relevant tools only if present, and focus on impact.
Output MUST be valid JSON only with keys: rewritten, keywords, warnings. No extra keys, no markdown, no commentary.`;

const ACTION_VERBS = new Set([
  'led', 'built', 'designed', 'improved', 'developed', 'implemented', 'delivered', 'automated',
  'reduced', 'increased', 'launched', 'coordinated', 'analyzed', 'analysed', 'created', 'managed',
  'supported', 'streamlined', 'documented', 'tested', 'deployed', 'owned', 'shipped', 'migrated',
  'optimized', 'optimised', 'collaborated', 'established', 'maintained', 'integrated', 'configured',
  'authored', 'mentored', 'facilitated', 'resolved', 'introduced', 'standardized', 'refactored',
  'produced', 'conducted', 'evaluated', 'presented', 'trained', 'architected', 'wrote', 'fixed',
  'paired', 'published', 'handled', 'contributed', 'completed', 'oversaw',
]);

const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'was', 'were', 'have',
  'has', 'will', 'our', 'their', 'about', 'into', 'over', 'under', 'using', 'use', 'used', 'role',
  'job', 'experience', 'work', 'team', 'ability', 'skills', 'strong', 'etc', 'not', 'provided',
  'who', 'what', 'when', 'where', 'which', 'while', 'across', 'through', 'within', 'including',
  'such', 'than', 'then', 'them', 'they', 'been', 'being', 'also', 'more', 'most', 'other', 'some',
  'able', 'well', 'plus', 'per', 'via', 'and', 'or', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by',
]);

const ACRONYMS = new Set(['sql', 'api', 'apis', 'aws', 'css', 'html', 'rest', 'ui', 'ux', 'qa', 'nlp', 'ci', 'cd']);

function hasLiveKey() {
  const key = (process.env.AI_API_KEY || '').trim();
  if (!key) return false;
  if (key.includes('...')) return false;
  if (/^(your[-_ ]?key|changeme|sk-your|placeholder)$/i.test(key)) return false;
  return true;
}

function aiStatus() {
  if (!hasLiveKey()) return { mode: 'local', model: null };
  return { mode: 'live', model: process.env.AI_MODEL || 'gpt-4o-mini' };
}

function buildUserPrompt({ mode, text, targetRole, jobDescription, existingSkills, constraints }) {
  const limits = {
    noFabrication: true,
    maxChars: 350,
    tone: 'professional',
    bulletStyle: 'achievement',
    ...(constraints || {}),
  };
  const skills = existingSkills && existingSkills.length ? existingSkills.join(', ') : 'N/A';
  return `Task mode: ${mode}
Target role: ${targetRole || 'Not provided'}
Job description (optional):
${jobDescription || 'N/A'}

Existing skills (optional): ${skills}

Text to rewrite:
${text}

Constraints:

noFabrication: ${limits.noFabrication}
maxChars: ${limits.maxChars}
tone: ${limits.tone}
bulletStyle: ${limits.bulletStyle}
Return JSON ONLY:
{
"rewritten": "...",
"keywords": ["..."],
"warnings": ["..."]
}`;
}

function parseModelJson(text) {
  const trimmed = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    const error = new Error('Model did not return valid JSON');
    error.status = 502;
    throw error;
  }
}

function clampText(text, maxChars) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const cut = slice.replace(/\s+\S*$/, '').trim();
  return cut || slice.trim();
}

function numbersIn(text) {
  return new Set(String(text).match(/\d+(?:\.\d+)?%?/g) || []);
}

function stripInventedNumbers(original, rewritten) {
  const known = numbersIn(original);
  const warnings = [];
  let changed = false;
  const text = rewritten.replace(/\d+(?:\.\d+)?%?/g, (num) => {
    if (known.has(num)) return num;
    changed = true;
    return 'X';
  });
  if (changed) {
    warnings.push('A number that was not in the original text was replaced with a placeholder.');
  }
  return { text, warnings };
}

function hasMetric(text) {
  return /\d|%/.test(text);
}

function tidy(text) {
  return String(text || '').replace(/\s+/g, ' ').replace(/^[\s•\-*–]+/, '').trim();
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function startsWithVerb(text) {
  const first = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  return ACTION_VERBS.has(first);
}

function softenOpening(text) {
  let next = text;
  const rules = [
    [/^i was responsible for\s+/i, 'Handled '],
    [/^i am responsible for\s+/i, 'Handle '],
    [/^responsible for\s+/i, 'Handled '],
    [/^i worked on\s+/i, 'Contributed to '],
    [/^worked on\s+/i, 'Contributed to '],
    [/^i helped with\s+/i, 'Supported '],
    [/^helped with\s+/i, 'Supported '],
    [/^i helped\s+/i, 'Supported '],
    [/^helped\s+/i, 'Supported '],
    [/^tasked with\s+/i, 'Handled '],
    [/^in charge of\s+/i, 'Oversaw '],
    [/^i am a\s+/i, ''],
    [/^i'm a\s+/i, ''],
    [/^i am an\s+/i, ''],
    [/^i\s+/i, ''],
  ];
  rules.forEach(([pattern, replacement]) => {
    next = next.replace(pattern, replacement);
  });
  return capitalize(next.replace(/\s+/g, ' ').trim());
}

function rewriteBullet(text) {
  let next = softenOpening(tidy(text));
  next = next.replace(/[.]+$/, '');
  if (!hasMetric(next) && !/\(e\.g\.,/i.test(next)) {
    next = `${next} (e.g., improved X by Y%)`;
  }
  return next;
}

function rewriteSummary(text, targetRole, maxChars) {
  let next = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  next = softenOpening(tidy(next));
  if (next && !/[.!?]$/.test(next)) next = `${next}.`;
  const role = String(targetRole || '').trim();
  if (role && !next.toLowerCase().includes(role.toLowerCase())) {
    const addition = ` Seeking ${role} roles.`;
    if (next.length + addition.length <= maxChars) next += addition;
  }
  return next;
}

function prettyKeyword(word) {
  const raw = String(word || '').trim();
  if (!raw) return '';
  if (ACRONYMS.has(raw.toLowerCase())) return raw.toLowerCase() === 'apis' ? 'APIs' : raw.toUpperCase();
  if (raw === raw.toUpperCase() && raw.length <= 5) return raw;
  return raw
    .split(/\s+/)
    .map((part) => (ACRONYMS.has(part.toLowerCase()) ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ');
}

function extractKeywords(targetRole, jobDescription, existingSkills) {
  const keywords = [];
  const push = (label) => {
    const pretty = prettyKeyword(String(label || '').replace(/[.,;:]+$/g, '').trim());
    if (!pretty || pretty.length < 2) return;
    if (STOP.has(pretty.toLowerCase())) return;
    if (keywords.some((existing) => existing.toLowerCase() === pretty.toLowerCase())) return;
    keywords.push(pretty);
  };

  if (targetRole) push(targetRole.trim());
  const jd = String(jobDescription || '');
  const jdLower = jd.toLowerCase();
  (existingSkills || []).forEach((skill) => {
    if (skill && jdLower.includes(String(skill).toLowerCase())) push(skill);
  });

  const techPattern = /\b(?:react|node\.?js|typescript|javascript|python|java|sql|aws|docker|kubernetes|postgres(?:ql)?|mongo(?:db)?|express|git|linux|graphql|redis|kafka|html|css|rest|api|vue|angular|django|spring)\b/gi;
  const found = jd.match(techPattern) || [];
  found.forEach((token) => push(token.replace(/nodejs/i, 'Node.js').replace(/node\.js/i, 'Node.js')));

  return keywords.slice(0, 8);
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function localRewrite(input) {
  const constraints = input.constraints || {};
  const maxChars = constraints.maxChars || 350;
  const warnings = ['Local rewriter is active. Set AI_API_KEY to use a live model.'];
  let rewritten;
  if (input.mode === 'section') {
    const lines = String(input.text)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    rewritten = lines.map((line) => rewriteBullet(line)).join('\n');
  } else if (input.mode === 'bullet') {
    rewritten = rewriteBullet(input.text);
  } else {
    rewritten = rewriteSummary(input.text, input.targetRole, maxChars);
    if (input.targetRole && rewritten.toLowerCase().includes(String(input.targetRole).toLowerCase())) {
      const originalHasRole = String(input.text).toLowerCase().includes(String(input.targetRole).toLowerCase());
      if (!originalHasRole) warnings.push('Added your target role as an interest, not as a past job title.');
    }
  }

  if (constraints.noFabrication !== false) {
    const guarded = stripInventedNumbers(input.text, rewritten);
    rewritten = guarded.text;
    warnings.push(...guarded.warnings);
  }

  if (rewritten.length > maxChars) {
    rewritten = clampText(rewritten, maxChars);
    warnings.push(`Trimmed to ${maxChars} characters.`);
  }

  if (String(input.text).trim().length < (input.mode === 'summary' ? 40 : 18)) {
    warnings.push('The original text is short. Add scope, tools, or an outcome you can verify.');
  }
  if ((input.mode === 'bullet' || input.mode === 'section') && !hasMetric(input.text)) {
    warnings.push('No measurable impact was in the original, so no real number was added. Replace the placeholder only if you have a figure.');
  }
  warnings.push('Keyword suggestions are not inserted into the resume.');

  return {
    rewritten,
    keywords: extractKeywords(input.targetRole, input.jobDescription, input.existingSkills),
    warnings: unique(warnings).slice(0, 6),
  };
}

function normalizeResult(parsed, input) {
  const constraints = input.constraints || {};
  let rewritten = typeof parsed.rewritten === 'string' ? parsed.rewritten.trim() : '';
  const keywords = Array.isArray(parsed.keywords)
    ? parsed.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
    : [];
  let warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];

  if (!rewritten) {
    const error = new Error('Model returned an empty rewrite');
    error.status = 502;
    throw error;
  }

  rewritten = rewritten.replace(/^```(?:json|text)?/i, '').replace(/```$/g, '').trim();
  if (input.mode === 'bullet') {
    rewritten = rewritten.replace(/^[\s•\-*]+/, '').trim();
  }

  if (constraints.noFabrication !== false) {
    const guarded = stripInventedNumbers(input.text, rewritten);
    rewritten = guarded.text;
    warnings = warnings.concat(guarded.warnings);
  }

  const maxChars = constraints.maxChars || 350;
  if (rewritten.length > maxChars) {
    rewritten = clampText(rewritten, maxChars);
    warnings.push(`Trimmed to ${maxChars} characters.`);
  }

  return {
    rewritten,
    keywords,
    warnings: unique(warnings).slice(0, 8),
  };
}

async function liveRewrite(input) {
  const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
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
  return normalizeResult(parseModelJson(content), input);
}

async function rewrite(input) {
  if (!hasLiveKey()) return localRewrite(input);
  return liveRewrite(input);
}

module.exports = {
  SYSTEM_PROMPT,
  rewrite,
  aiStatus,
  buildUserPrompt,
  hasLiveKey,
};
