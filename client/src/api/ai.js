import { http } from './http';

export async function rewriteResumeText(payload) {
  const { data } = await http.post('/ai/rewrite', payload);
  return data;
}

export async function fetchAiStatus() {
  const { data } = await http.get('/ai/status');
  return data;
}
