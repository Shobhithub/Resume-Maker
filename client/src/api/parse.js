import { http, readApiError } from './http';

// POST /api/parse/resume — multipart/form-data with file + optional context.
// Returns { resumeData, warnings } on success; throws Error(message) otherwise.
export async function parseResumeFile(file, { targetRole, jobDescription } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (targetRole) form.append('targetRole', String(targetRole).slice(0, 200));
  if (jobDescription) form.append('jobDescription', String(jobDescription).slice(0, 8000));
  try {
    const { data } = await http.post('/parse/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return data;
  } catch (error) {
    throw new Error(await readApiError(error));
  }
}
