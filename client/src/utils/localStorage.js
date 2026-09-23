import { ensureResumeShape } from './defaultResume';

export const DRAFT_KEY = 'resumeDraft';

export function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.contact) return null;
    return ensureResumeShape(parsed);
  } catch {
    return null;
  }
}

export function saveDraft(resume) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(resume));
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
