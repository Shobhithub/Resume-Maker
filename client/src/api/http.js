import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function readApiError(error) {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json.error || text || 'Request failed';
    } catch {
      return 'Request failed';
    }
  }

  if (typeof data?.error === 'string') return data.error;

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Try again in a moment.';
  }

  if (!error?.response) {
    if (error?.message && error.message !== 'Network Error') {
      return error.message;
    }

    return 'Cannot reach the server.';
  }

  return error.message || 'Request failed';
}