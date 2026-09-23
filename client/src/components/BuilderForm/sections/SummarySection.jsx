import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRewrite } from '../../AiRewritePanel/useRewrite';
import { TextArea } from './fields';

export function SummarySection() {
  const { getValues, setValue, watch } = useFormContext();
  const { rewrite, aiBusy } = useRewrite();
  const summary = watch('summary') || '';
  const [previous, setPrevious] = useState('');

  async function improve() {
    const current = getValues('summary') || '';
    setPrevious(current);
    await rewrite({
      mode: 'summary',
      text: current,
      maxChars: 500,
      apply: (next) => setValue('summary', next, { shouldDirty: true, shouldValidate: true }),
    });
  }

  return (
    <div className="space-y-3">
      <TextArea
        name="summary"
        label="Summary"
        rows={5}
        hint={`${summary.trim().length} chars`}
        placeholder="A short professional summary. State what you do, the tools you actually use, and the kind of work you want."
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary" onClick={improve} disabled={aiBusy || !summary.trim()}>
          {aiBusy ? 'Rewriting…' : 'Improve summary'}
        </button>
        {previous && previous !== summary && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setValue('summary', previous, { shouldDirty: true, shouldValidate: true });
              setPrevious('');
            }}
          >
            Undo summary
          </button>
        )}
      </div>
      <p className="text-xs leading-relaxed text-mute">
        Rewrites stay inside what you wrote. Missing numbers become placeholders, not invented metrics.
      </p>
    </div>
  );
}
