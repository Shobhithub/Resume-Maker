import { useFormContext } from 'react-hook-form';
import { IconButton } from './fields';

export function AchievementsSection() {
  const { register, watch, getValues, setValue } = useFormContext();
  const items = watch('achievements') || [];

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-mute">Awards, mentoring, publications, or other facts worth a line.</p>
      )}
      {items.map((item, index) => (
        <div key={`achievement-${index}`} className="flex items-start gap-1">
          <textarea
            rows={2}
            className="field-input min-h-[64px] flex-1 resize-y"
            placeholder="One achievement, in plain language."
            {...register(`achievements.${index}`)}
          />
          <IconButton
            label="Remove achievement"
            tone="danger"
            onClick={() => {
              const next = (getValues('achievements') || []).filter((_, itemIndex) => itemIndex !== index);
              setValue('achievements', next, { shouldDirty: true, shouldValidate: true });
            }}
          >
            Remove
          </IconButton>
        </div>
      ))}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setValue('achievements', [...(getValues('achievements') || []), ''], { shouldDirty: true })}
      >
        Add achievement
      </button>
    </div>
  );
}
