import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AiRewritePanel } from '../components/AiRewritePanel/AiRewritePanel';
import { BuilderForm } from '../components/BuilderForm/BuilderForm';
import { Preview } from '../components/Preview/Preview';
import { TemplateGallery } from '../components/TemplateGallery/TemplateGallery';
import { UploadResume } from '../components/UploadResume/UploadResume';
import { exportDocx, exportPdf } from '../api/export';
import { Wordmark } from './Home';
import { useResumeStore } from '../store/useResumeStore';
import { ensureResumeShape } from '../utils/defaultResume';
import { downloadResumeJson } from '../utils/downloadJson';
import { resumeSchema } from '../utils/resumeSchema';

export function Builder() {
  const stored = useResumeStore((state) => state.resume);
  const setResume = useResumeStore((state) => state.setResume);
  const saveStatus = useResumeStore((state) => state.saveStatus);
  const resetToken = useResumeStore((state) => state.resetToken);
  const resetToSample = useResumeStore((state) => state.resetToSample);
  const startBlank = useResumeStore((state) => state.startBlank);
  const [pane, setPane] = useState('edit');
  const [exporting, setExporting] = useState('');
  const [confirm, setConfirm] = useState('');
  const [toast, setToast] = useState(null); // { kind: 'ok' | 'error', message }
  const toastTimer = useRef(null);

  function showToast(kind, message) {
    window.clearTimeout(toastTimer.current);
    setToast({ kind, message });
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }

  const methods = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: stored,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const watched = useWatch({ control: methods.control });
  const resume = useMemo(() => ensureResumeShape(watched || methods.getValues()), [watched, methods]);

  useEffect(() => {
    setResume(resume);
  }, [resume, setResume]);

  useEffect(() => {
    if (!resetToken) return;
    methods.reset(useResumeStore.getState().resume);
  }, [resetToken, methods]);

  async function runExport(kind) {
    setExporting(kind);
    try {
      const current = ensureResumeShape(methods.getValues());
      if (kind === 'pdf') {
        await exportPdf(current);
        showToast('ok', 'PDF exported. Check your downloads.');
      } else {
        await exportDocx(current);
        showToast('ok', 'DOCX exported. Check your downloads.');
      }
    } catch (error) {
      showToast('error', error.message || 'Export failed. Please try again.');
    } finally {
      setExporting('');
    }
  }

  function runJsonDownload() {
    try {
      const current = ensureResumeShape(methods.getValues());
      downloadResumeJson(current);
      showToast('ok', 'resumeData.json downloaded.');
    } catch (error) {
      showToast('error', error.message || 'Could not download the JSON file.');
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3">
            <Wordmark />
            <label className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
              <span className="sr-only">Resume title</span>
              <input
                className="w-full max-w-xs truncate bg-transparent text-sm text-mute outline-none placeholder:text-mute/60"
                placeholder="Resume title"
                {...methods.register('title')}
              />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <p className="hidden items-center gap-1.5 text-xs text-mute sm:flex" aria-live="polite">
                <span className={`h-1.5 w-1.5 rounded-full ${saveStatus === 'saving' ? 'bg-accent' : 'bg-pine'}`} />
                {saveStatus === 'saving' ? 'Saving' : 'Saved'}
              </p>
              <button type="button" className="btn-secondary" disabled={Boolean(exporting)} onClick={() => runExport('pdf')}>
                {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
              </button>
              <button type="button" className="btn-secondary" disabled={Boolean(exporting)} onClick={() => runExport('docx')}>
                {exporting === 'docx' ? 'Exporting…' : 'Export DOCX'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                title="Download the current resume data as JSON"
                disabled={Boolean(exporting)}
                onClick={runJsonDownload}
              >
                Download JSON
              </button>
              <button type="button" className="btn-ghost" onClick={() => setConfirm(confirm ? '' : 'open')}>
                Reset
              </button>
            </div>
          </div>
          {confirm && (
            <div className="border-t border-line bg-card/95">
              <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 text-sm">
                <span className="text-mute">Replace this draft?</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    resetToSample();
                    setConfirm('');
                  }}
                >
                  Restore sample
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    startBlank();
                    setConfirm('');
                  }}
                >
                  Start blank
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirm('')}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </header>

        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3 lg:hidden">
          <button type="button" className={pane === 'edit' ? 'btn-primary' : 'btn-secondary'} onClick={() => setPane('edit')}>
            Edit
          </button>
          <button type="button" className={pane === 'preview' ? 'btn-primary' : 'btn-secondary'} onClick={() => setPane('preview')}>
            Preview
          </button>
        </div>

        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-4 pb-10 lg:grid-cols-[minmax(340px,460px)_minmax(0,1fr)] lg:pt-5">
          <div className={`space-y-4 ${pane === 'preview' ? 'hidden lg:block' : ''}`}>
            <UploadResume onNotify={showToast} />
            <TemplateGallery resume={resume} />
            <AiRewritePanel />
            <BuilderForm />
          </div>
          <div className={`lg:sticky lg:top-[76px] lg:self-start ${pane === 'edit' ? 'hidden lg:block' : ''}`}>
            <Preview resume={resume} />
          </div>
        </div>

        {toast && toast.message && (
          <div
            className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg ${
              toast.kind === 'error' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-line bg-card text-ink'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true">{toast.kind === 'error' ? '!' : '✓'}</span>
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                className="-mr-1 rounded-md px-1.5 text-mute hover:text-ink"
                aria-label="Dismiss notification"
                onClick={() => {
                  window.clearTimeout(toastTimer.current);
                  setToast(null);
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
