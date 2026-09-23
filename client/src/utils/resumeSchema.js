import { z } from 'zod';

const text = (max) => z.string().max(max);

function yearMonthOk(value) {
  if (!value) return true;
  if (/^\d{0,4}$/.test(value) || /^\d{4}-$/.test(value) || /^\d{4}-\d{0,1}$/.test(value)) return true;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function endDateOk(value) {
  if (!value || /^present$/i.test(value)) return true;
  return yearMonthOk(value);
}

function yearOk(value) {
  if (!value || /^present$/i.test(value)) return true;
  return /^\d{0,4}$/.test(value);
}

export const resumeSchema = z.object({
  title: text(120),
  templateId: z.enum(['classic-1', 'classic-2', 'compact-1']),
  targetRole: text(120),
  jobDescription: text(8000),
  contact: z.object({
    name: text(80),
    email: z
      .string()
      .max(120)
      .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Enter a valid email'),
    phone: text(40),
    location: text(80),
    linkedin: text(160),
    github: text(160),
    portfolio: text(160),
  }),
  summary: text(2000),
  experience: z
    .array(
      z.object({
        company: text(120),
        role: text(120),
        location: text(80),
        start: z.string().max(10).refine(yearMonthOk, 'Use YYYY-MM'),
        end: z.string().max(10).refine(endDateOk, 'Use YYYY-MM or Present'),
        bullets: z.array(text(500)).max(12),
        tech: z.array(text(40)).max(20),
      }),
    )
    .max(12),
  projects: z
    .array(
      z.object({
        name: text(120),
        link: text(200),
        bullets: z.array(text(500)).max(8),
        tech: z.array(text(40)).max(20),
      }),
    )
    .max(12),
  education: z
    .array(
      z.object({
        school: text(120),
        degree: text(120),
        location: text(80),
        start: z.string().max(10).refine(yearOk, 'Use YYYY'),
        end: z.string().max(10).refine(yearOk, 'Use YYYY or Present'),
        score: text(40),
      }),
    )
    .max(8),
  skills: z.object({
    languages: z.array(text(40)).max(30),
    frameworks: z.array(text(40)).max(30),
    tools: z.array(text(40)).max(30),
    databases: z.array(text(40)).max(30),
    other: z.array(text(40)).max(30),
  }),
  certifications: z
    .array(
      z.object({
        name: text(120),
        issuer: text(120),
        year: z.string().max(10).refine(yearOk, 'Use YYYY'),
      }),
    )
    .max(12),
  achievements: z.array(text(300)).max(12),
});
