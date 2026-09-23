// Client-side download of the current resumeData object. No server involved.
export function downloadJson(data, filename = 'resumeData.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadResumeJson(resumeData) {
  downloadJson(resumeData, 'resumeData.json');
}
