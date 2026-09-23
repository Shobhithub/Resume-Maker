import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { fetchAiStatus } from '../../api/ai';
import { useResumeStore } from '../../store/useResumeStore';
import { TextArea, TextInput } from '../BuilderForm/sections/fields';

export function AiRewritePanel() {
  const lastAi = useResumeStore((state) => state.lastAi);
  const aiError = useResumeStore((state) => state.aiError);
  const aiBusy = useResumeStore((state) => state.aiBusy);
  const [status, setStatus] = useState(null);
  const { watch } = useFormContext();
  const role = watch('targetRole');

  useEffect(() => {
    let cancelled = false;
    fetchAiStatus()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        if (!cancelled) setStatus({ mode: 'unknown' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const providerLabel =
    status?.mode === 'live'
      ? `Live model · ${status.model || 'configured'}`
      : status?.mode === 'local'
        ? 'Local rewriter · add an API key for a live model'
        : 'Checking rewriter';

  return (
    <section className="rounded-2xl border border-line bg-card/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Rewrite</h2>
          <p className="mt-1 text-xs leading-relaxed text-mute">
            Target role and job description steer wording. They are not printed on the resume.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-ink/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-mute">
          {aiBusy ? 'Working' : 'Truthful'}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        <TextInput name="targetRole" label="Target role" placeholder="Software Engineer" />
        <TextArea
          name="jobDescription"
          label="Job description"
          rows={4}
          hint="Optional"
          placeholder="Paste a posting if you want keywords suggested from it. Nothing here is added unless it is already true in your draft."
        />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-mute">{providerLabel}</p>
      {role && (
        <p className="mt-1 text-[11px] text-mute">
          Improve buttons in Summary and Experience use this role{status?.mode === 'local' ? ' and the local rewriter' : ''}.
        </p>
      )}
      {aiError && (
        <p className="mt-3 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-accent" role="alert">
          {aiError}
        </p>
      )}
      {lastAi && (
        <div className="mt-3 space-y-2 rounded-xl border border-line bg-white/80 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">Latest rewrite</p>
          {lastAi.keywords?.length > 0 && (
            <div>
              <p className="text-xs text-ink">Keyword suggestions</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {lastAi.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink">
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-mute">Suggestions only. Add one only if it is true for you.</p>
            </div>
          )}
          {lastAi.warnings?.length > 0 && (
            <div>
              <p className="text-xs text-ink">Notes</p>
              <ul className="mt-1 space-y-1 text-xs leading-relaxed text-mute">
                {lastAi.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
