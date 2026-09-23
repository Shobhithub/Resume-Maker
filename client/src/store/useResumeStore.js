import { create } from 'zustand';
import { cloneResume, defaultResume, emptyResume, ensureResumeShape } from '../utils/defaultResume';
import { clearDraft, loadDraft, saveDraft } from '../utils/localStorage';

const saved = loadDraft();
let lastSerial = JSON.stringify(saved || defaultResume);
let saveTimer;

function scheduleSave(resume, onDone) {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveDraft(resume);
    onDone();
  }, 350);
}

export const useResumeStore = create((set) => ({
  resume: saved || cloneResume(defaultResume),
  saveStatus: 'saved',
  resetToken: 0,
  lastAi: null,
  aiBusy: false,
  aiError: '',
  setResume: (resume) => {
    const serial = JSON.stringify(resume);
    if (serial === lastSerial) return;
    lastSerial = serial;
    set({ resume, saveStatus: 'saving' });
    scheduleSave(resume, () => set({ saveStatus: 'saved' }));
  },
  setTemplate: (templateId) => {
    set((state) => {
      const resume = { ...state.resume, templateId };
      lastSerial = JSON.stringify(resume);
      scheduleSave(resume, () => set({ saveStatus: 'saved' }));
      return { resume, saveStatus: 'saving' };
    });
  },
  loadResume: (resume) => {
    const next = ensureResumeShape(resume);
    clearDraft();
    saveDraft(next);
    lastSerial = JSON.stringify(next);
    set((state) => ({
      resume: next,
      saveStatus: 'saved',
      resetToken: state.resetToken + 1,
      lastAi: null,
      aiError: '',
    }));
  },
  resetToSample: () => {
    clearDraft();
    const resume = cloneResume(defaultResume);
    lastSerial = JSON.stringify(resume);
    set((state) => ({
      resume,
      saveStatus: 'saved',
      resetToken: state.resetToken + 1,
      lastAi: null,
      aiError: '',
    }));
  },
  startBlank: () => {
    clearDraft();
    const resume = emptyResume();
    lastSerial = JSON.stringify(resume);
    saveDraft(resume);
    set((state) => ({
      resume,
      saveStatus: 'saved',
      resetToken: state.resetToken + 1,
      lastAi: null,
      aiError: '',
    }));
  },
  setLastAi: (lastAi) => set({ lastAi }),
  setAiBusy: (aiBusy) => set({ aiBusy }),
  setAiError: (aiError) => set({ aiError }),
}));
