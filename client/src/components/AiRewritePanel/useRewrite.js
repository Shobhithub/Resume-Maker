import { useFormContext } from 'react-hook-form';
import { rewriteResumeText } from '../../api/ai';
import { readApiError } from '../../api/http';
import { useResumeStore } from '../../store/useResumeStore';
import { collectSkills } from '../../utils/text';

export function useRewrite() {
  const { getValues, setValue } = useFormContext();
  const aiBusy = useResumeStore((state) => state.aiBusy);
  const setAiBusy = useResumeStore((state) => state.setAiBusy);
  const setLastAi = useResumeStore((state) => state.setLastAi);
  const setAiError = useResumeStore((state) => state.setAiError);

  async function rewrite({ mode, text, maxChars, apply }) {
    const trimmed = String(text || '').trim();
    if (!trimmed) {
      setAiError('Add some text before rewriting.');
      return null;
    }
    const resume = getValues();
    setAiBusy(true);
    setAiError('');
    try {
      const result = await rewriteResumeText({
        mode,
        text: trimmed,
        targetRole: resume.targetRole || '',
        jobDescription: resume.jobDescription || '',
        existingSkills: collectSkills(resume),
        constraints: {
          noFabrication: true,
          maxChars,
          tone: 'professional',
          bulletStyle: 'achievement',
        },
      });
      if (!result?.rewritten) {
        throw new Error('Rewrite came back empty.');
      }
      setLastAi({ ...result, mode, at: Date.now() });
      if (apply) apply(result.rewritten, setValue, getValues);
      return result;
    } catch (error) {
      setAiError(await readApiError(error));
      return null;
    } finally {
      setAiBusy(false);
    }
  }

  return { rewrite, aiBusy };
}
