export const emptyExperience = () => ({
  company: '',
  role: '',
  location: '',
  start: '',
  end: '',
  bullets: [''],
  tech: [],
});

export const emptyProject = () => ({
  name: '',
  link: '',
  bullets: [''],
  tech: [],
});

export const emptyEducation = () => ({
  school: '',
  degree: '',
  location: '',
  start: '',
  end: '',
  score: '',
});

export const emptyCertification = () => ({
  name: '',
  issuer: '',
  year: '',
});

export function emptyResume() {
  return {
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
    experience: [],
    projects: [],
    education: [],
    skills: {
      languages: [],
      frameworks: [],
      tools: [],
      databases: [],
      other: [],
    },
    certifications: [],
    achievements: [],
  };
}

export const defaultResume = {
  title: 'Software Engineer Resume',
  templateId: 'classic-1',
  targetRole: 'Software Engineer',
  jobDescription: '',
  contact: {
    name: 'Ananya Sharma',
    email: 'ananya.sharma@email.com',
    phone: '+91 98100 11223',
    location: 'Dehradun, India',
    linkedin: 'linkedin.com/in/ananya-sharma',
    github: 'github.com/ananyasharma',
    portfolio: 'ananyasharma.dev',
  },
  summary:
    'Software engineer with 4 years of experience building web applications in JavaScript, React, and Node.js. Comfortable owning features from API design through release, writing clear documentation, and working with product and QA. Interested in roles that value reliable delivery and maintainable code.',
  experience: [
    {
      company: 'Northwind Labs',
      role: 'Software Engineer',
      location: 'Dehradun, India',
      start: '2022-03',
      end: 'Present',
      bullets: [
        'Built and maintained customer-facing React features for an internal hiring platform used by recruiters across 3 offices.',
        'Designed REST endpoints in Node.js and Express for job posting, candidate review, and interview scheduling.',
        'Reduced average page load time on the applicant list by caching repeated queries and trimming unused payload fields.',
        'Wrote integration tests for critical hiring flows and documented release steps for the on-call rotation.',
      ],
      tech: ['React', 'Node.js', 'Express', 'PostgreSQL'],
    },
    {
      company: 'Hillcrest Systems',
      role: 'Junior Software Engineer',
      location: 'Remote',
      start: '2020-07',
      end: '2022-02',
      bullets: [
        'Implemented dashboard filters and CSV export for an operations tool used by support leads.',
        'Fixed production defects in a legacy JavaScript codebase and added regression notes to the team wiki.',
        'Paired with senior engineers on code review and shipped small, well-scoped pull requests weekly.',
      ],
      tech: ['JavaScript', 'HTML', 'CSS', 'MySQL'],
    },
  ],
  projects: [
    {
      name: 'Trailnotes',
      link: 'github.com/ananyasharma/trailnotes',
      bullets: [
        'Personal project for logging hike notes offline and syncing them when a connection returns.',
        'Built a small React interface and a Node API with file-based storage for a single-user demo.',
      ],
      tech: ['React', 'Node.js'],
    },
  ],
  education: [
    {
      school: 'Graphic Era University',
      degree: 'B.Tech, Computer Science',
      location: 'Dehradun, India',
      start: '2016',
      end: '2020',
      score: '8.2 CGPA',
    },
  ],
  skills: {
    languages: ['JavaScript', 'TypeScript', 'SQL'],
    frameworks: ['React', 'Express', 'Node.js'],
    tools: ['Git', 'Vite', 'Linux'],
    databases: ['PostgreSQL', 'MongoDB'],
    other: ['REST APIs', 'Technical writing'],
  },
  certifications: [
    { name: 'AWS Cloud Practitioner', issuer: 'Amazon Web Services', year: '2023' },
  ],
  achievements: [
    'Mentored two interns through their first production pull requests at Northwind Labs.',
    'Published a short internal guide on writing clearer job descriptions for the recruiting team.',
  ],
};

export function cloneResume(resume = defaultResume) {
  return JSON.parse(JSON.stringify(resume));
}

function asString(value, max = 8000) {
  if (value == null) return '';
  return String(value).slice(0, max);
}

function asList(value, max = 20) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, max).map((item) => asString(item, 500));
}

const TEMPLATE_IDS = new Set(['classic-1', 'classic-2', 'compact-1']);

export function ensureResumeShape(data) {
  const blank = emptyResume();
  const source = data && typeof data === 'object' ? data : {};
  return {
    title: asString(source.title ?? blank.title, 120),
    templateId: TEMPLATE_IDS.has(source.templateId) ? source.templateId : 'classic-1',
    targetRole: asString(source.targetRole, 120),
    jobDescription: asString(source.jobDescription, 8000),
    contact: {
      ...blank.contact,
      ...(source.contact && typeof source.contact === 'object' ? source.contact : {}),
    },
    summary: asString(source.summary, 2000),
    experience: Array.isArray(source.experience)
      ? source.experience.slice(0, 12).map((item) => ({
          ...emptyExperience(),
          ...(item || {}),
          bullets: asList(item?.bullets, 12),
          tech: asList(item?.tech, 20),
        }))
      : [],
    projects: Array.isArray(source.projects)
      ? source.projects.slice(0, 12).map((item) => ({
          ...emptyProject(),
          ...(item || {}),
          bullets: asList(item?.bullets, 8),
          tech: asList(item?.tech, 20),
        }))
      : [],
    education: Array.isArray(source.education)
      ? source.education.slice(0, 8).map((item) => ({
          ...emptyEducation(),
          ...(item || {}),
        }))
      : [],
    skills: {
      ...blank.skills,
      ...(source.skills && typeof source.skills === 'object' ? source.skills : {}),
      languages: asList(source.skills?.languages, 30),
      frameworks: asList(source.skills?.frameworks, 30),
      tools: asList(source.skills?.tools, 30),
      databases: asList(source.skills?.databases, 30),
      other: asList(source.skills?.other, 30),
    },
    certifications: Array.isArray(source.certifications)
      ? source.certifications.slice(0, 12).map((item) => ({
          ...emptyCertification(),
          ...(item || {}),
        }))
      : [],
    achievements: asList(source.achievements, 12),
  };
}
