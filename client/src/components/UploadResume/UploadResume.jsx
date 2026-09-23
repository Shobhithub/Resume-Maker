import { useRef, useState } from 'react';
import { parseResumeFile } from '../../api/parse';
import { ensureResumeShape } from '../../utils/defaultResume';
import { useResumeStore } from '../../store/useResumeStore';

const REQUIRED_TOP_LEVEL_KEYS = [
  'title',
  'templateId',
  'targetRole',
  'jobDescription',
  'contact',
  'summary',
  'experience',
  'projects',
  'education',
  'skills',
  'certifications',
  'achievements',
];

// JSON upload only accepts files that already match the app schema.
function readJsonResume(file) {
  return file.text().then((text) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('That JSON file is not valid JSON.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('That JSON file does not match the app’s resume schema.');
    }
    const missing = REQUIRED_TOP_LEVEL_KEYS.filter((key) => !(key in parsed));
    if (missing.length) {
      throw new Error(`That JSON file is missing schema keys: ${missing.join(', ')}.`);
    }
    return ensureResumeShape(parsed);
  });
}

export function UploadResume({ onNotify }) {
  const loadResume = useResumeStore((state) => state.loadResume);
  const currentTargetRole = useResumeStore((state) => state.resume.targetRole);
  const currentJobDescription = useResumeStore((state) => state.resume.jobDescription);
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null); // { fileName, resumeData, warnings }

  function pick() {
    inputRef.current?.click();
  }

  async function handleFile(file) {
    if (!file) return;
    if (pending) return;
    const isJson = /\.json$/i.test(file.name) || file.type === 'application/json';

    if (isJson) {
      try {
        const resumeData = await readJsonResume(file);
        setPending({ fileName: file.name, resumeData, warnings: ['Loaded directly from JSON — schema already matched.'] });
      } catch (error) {
        onNotify('error', error.message || 'That JSON file could not be loaded.');
      }
      return;
    }

    setBusy(true);
    try {
      const { resumeData, warnings } = await parseResumeFile(file, {
        targetRole: currentTargetRole,
        jobDescription: currentJobDescription,
      });
      setPending({ fileName: file.name, resumeData: ensureResumeShape(resumeData), warnings: warnings || [] });
    } catch (error) {
      onNotify('error', error.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function replace() {
    if (!pending) return;
    loadResume(pending.resumeData);
    onNotify('ok', `“${pending.fileName}” loaded. Edit anything below, then export.`);
    setPending(null);
  }

  function cancel() {
    setPending(null);
  }

  return (
    <section className="rounded-2xl border border-line bg-card/90 p-3 shadow-sm" aria-label="Upload resume">
      <div className="flex flex-wrap items-center gap-2 px-1 pb-1">
        <h2 className="text-sm font-medium text-ink">Upload resume</h2>
        <span className="text-[11px] uppercase tracking-[0.14em] text-mute">PDF · DOCX · JSON</span>
        <button
          type="button"
          className="btn-primary ml-auto"
          onClick={pick}
          disabled={busy || Boolean(pending)}
        >
          {busy ? 'Parsing…' : 'Choose file'}
        </button>
      </div>
      <p className="px-1 pt-1 text-xs leading-relaxed text-mute">
        Turns an existing resume into editable fields. Nothing is invented — missing details stay blank.
        Uses this draft’s target role and job description as parsing hints; up to 5MB.
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-confirm-title">
          <div className="w-full max-w-md rounded-2xl border border-line bg-paper p-5 shadow-xl">
            <h3 id="upload-confirm-title" className="text-base font-medium text-ink">
              Replace current resume with uploaded resume?
            </h3>
            <p className="mt-2 text-sm text-mute">
              {pending.fileName} was parsed into editable fields. Your current draft will be replaced.
            </p>
            {pending.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl border border-line bg-card px-3 py-2 text-xs leading-relaxed text-mute">
                {pending.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={cancel}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={replace} autoFocus>
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
