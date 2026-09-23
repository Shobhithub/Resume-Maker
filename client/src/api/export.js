import { http, readApiError } from './http';
import { safeFileName } from '../utils/text';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function postExport(path, resumeData, extension) {
  try {
    const response = await http.post(
      path,
      { resumeData, templateId: resumeData.templateId },
      { responseType: 'blob' },
    );
    const base = safeFileName(resumeData.contact?.name || resumeData.title);
    downloadBlob(response.data, `${base}-resume.${extension}`);
  } catch (error) {
    throw new Error(await readApiError(error));
  }
}

export function exportPdf(resumeData) {
  return postExport('/export/pdf', resumeData, 'pdf');
}

export function exportDocx(resumeData) {
  return postExport('/export/docx', resumeData, 'docx');
}
