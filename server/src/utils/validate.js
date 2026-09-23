const { z } = require('zod');

const str = (max, fallback = '') => z.string().max(max).optional().default(fallback);
const list = (maxItem = 500, max = 20) => z.array(z.string().max(maxItem)).max(max).optional().default([]);

const experienceItem = z
  .object({
    company: str(200),
    role: str(200),
    location: str(200),
    start: str(20),
    end: str(20),
    bullets: list(800, 16),
    tech: list(60, 24),
  })
  .strip();

const projectItem = z
  .object({
    name: str(200),
    link: str(300),
    bullets: list(800, 12),
    tech: list(60, 24),
  })
  .strip();

const educationItem = z
  .object({
    school: str(200),
    degree: str(200),
    location: str(200),
    start: str(20),
    end: str(20),
    score: str(80),
  })
  .strip();

const certificationItem = z
  .object({
    name: str(200),
    issuer: str(200),
    year: str(20),
  })
  .strip();

const resumeSchema = z
  .object({
    title: str(160, 'Resume'),
    templateId: z.enum(['classic-1', 'classic-2', 'compact-1']).optional().default('classic-1'),
    targetRole: str(160),
    jobDescription: str(8000),
    contact: z
      .object({
        name: str(120),
        email: str(160),
        phone: str(60),
        location: str(120),
        linkedin: str(200),
        github: str(200),
        portfolio: str(200),
      })
      .partial()
      .optional()
      .default({}),
    summary: str(4000),
    experience: z.array(experienceItem).max(16).optional().default([]),
    projects: z.array(projectItem).max(16).optional().default([]),
    education: z.array(educationItem).max(10).optional().default([]),
    skills: z
      .object({
        languages: list(60, 40),
        frameworks: list(60, 40),
        tools: list(60, 40),
        databases: list(60, 40),
        other: list(60, 40),
      })
      .partial()
      .optional()
      .default({}),
    certifications: z.array(certificationItem).max(16).optional().default([]),
    achievements: list(400, 16),
  })
  .strip();

const rewriteSchema = z
  .object({
    mode: z.enum(['summary', 'bullet', 'section']),
    text: z.string().trim().min(1, 'Text is required').max(8000),
    targetRole: z.string().max(200).optional().default(''),
    jobDescription: z.string().max(8000).optional().default(''),
    existingSkills: z.array(z.string().max(80)).max(80).optional().default([]),
    constraints: z
      .object({
        noFabrication: z.boolean().optional().default(true),
        maxChars: z.number().int().min(40).max(4000).optional().default(350),
        tone: z.string().max(40).optional().default('professional'),
        bulletStyle: z.string().max(40).optional().default('achievement'),
      })
      .optional()
      .default({}),
  })
  .strip();

const exportSchema = z
  .object({
    resumeData: resumeSchema,
    templateId: z.enum(['classic-1', 'classic-2', 'compact-1']),
  })
  .strip();

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    return next();
  };
}

module.exports = {
  resumeSchema,
  rewriteSchema,
  exportSchema,
  validateBody,
};
