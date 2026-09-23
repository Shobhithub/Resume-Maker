import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useRewrite } from '../../AiRewritePanel/useRewrite';
import { emptyExperience } from '../../../utils/defaultResume';
import { cleanList } from '../../../utils/text';
import { CommaListInput, EndDateInput, IconButton, TextInput } from './fields';

export function ExperienceSection() {
  const { control } = useFormContext();
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'experience' });

  return (
    <div className="space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-mute">No roles yet. Add the jobs you can describe honestly.</p>
      )}
      {fields.map((field, index) => (
        <ExperienceCard
          key={field.id}
          index={index}
          total={fields.length}
          onRemove={() => remove(index)}
          onMove={(dir) => swap(index, index + dir)}
        />
      ))}
      <button type="button" className="btn-secondary" onClick={() => append(emptyExperience())}>
        Add experience
      </button>
    </div>
  );
}

function ExperienceCard({ index, total, onRemove, onMove }) {
  const { register, getValues, setValue, watch } = useFormContext();
  const bulletValues = watch(`experience.${index}.bullets`) || [''];
  const { rewrite, aiBusy } = useRewrite();
  const [undo, setUndo] = useState(null);
  const tech = watch(`experience.${index}.tech`) || [];
  const role = watch(`experience.${index}.role`);
  const company = watch(`experience.${index}.company`);

  async function improveBullet(bulletIndex) {
    const path = `experience.${index}.bullets.${bulletIndex}`;
    const current = getValues(path) || '';
    setUndo({ type: 'bullet', index: bulletIndex, value: current });
    await rewrite({
      mode: 'bullet',
      text: current,
      maxChars: 280,
      apply: (next) => setValue(path, next, { shouldDirty: true, shouldValidate: true }),
    });
  }

  async function improveAll() {
    const current = getValues(`experience.${index}.bullets`) || [];
    const filled = cleanList(current);
    if (!filled.length) return;
    setUndo({ type: 'all', value: current });
    await rewrite({
      mode: 'section',
      text: filled.join('\n'),
      maxChars: 1600,
      apply: (next) => {
        const lines = next
          .split(/\n+/)
          .map((line) => line.replace(/^[\s•\-*–]+/, '').trim())
          .filter(Boolean);
        setValue(`experience.${index}.bullets`, lines.length ? lines : current, {
          shouldDirty: true,
          shouldValidate: true,
        });
      },
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-white/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {role || company ? [role, company].filter(Boolean).join(' · ') : `Role ${index + 1}`}
        </p>
        <div className="flex">
          <IconButton label="Move role up" disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </IconButton>
          <IconButton label="Move role down" disabled={index === total - 1} onClick={() => onMove(1)}>
            Down
          </IconButton>
          <IconButton label="Remove role" tone="danger" onClick={onRemove}>
            Remove
          </IconButton>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput name={`experience.${index}.role`} label="Role" placeholder="Software Engineer" />
        <TextInput name={`experience.${index}.company`} label="Company" placeholder="Northwind Labs" />
        <TextInput name={`experience.${index}.location`} label="Location" placeholder="City or Remote" />
        <TextInput name={`experience.${index}.start`} label="Start" placeholder="2022-03" hint="YYYY-MM" />
        <EndDateInput name={`experience.${index}.end`} label="End" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
          Technologies
        </span>
        <CommaListInput
          value={tech}
          placeholder="React, Node.js"
          onChange={(next) => setValue(`experience.${index}.tech`, next, { shouldDirty: true })}
        />
      </label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">Bullets</span>
          <button type="button" className="btn-ghost" disabled={aiBusy} onClick={improveAll}>
            Rewrite bullets
          </button>
        </div>
        {bulletValues.map((bullet, bulletIndex) => (
          <div key={`${index}-bullet-${bulletIndex}`} className="flex items-start gap-1">
            <textarea
              rows={2}
              className="field-input min-h-[64px] flex-1 resize-y"
              placeholder="What you did, with tools and scope you can stand behind."
              {...register(`experience.${index}.bullets.${bulletIndex}`)}
            />
            <div className="flex flex-col">
              <IconButton label="Improve bullet" disabled={aiBusy || !String(bullet || '').trim()} onClick={() => improveBullet(bulletIndex)}>
                Improve
              </IconButton>
              <IconButton
                label="Remove bullet"
                tone="danger"
                disabled={bulletValues.length <= 1}
                onClick={() => {
                  const next = (getValues(`experience.${index}.bullets`) || []).filter((_, itemIndex) => itemIndex !== bulletIndex);
                  setValue(`experience.${index}.bullets`, next.length ? next : [''], { shouldDirty: true, shouldValidate: true });
                }}
              >
                Remove
              </IconButton>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            const current = getValues(`experience.${index}.bullets`) || [];
            setValue(`experience.${index}.bullets`, [...current, ''], { shouldDirty: true });
          }}
        >
          Add bullet
        </button>
        {undo && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              if (undo.type === 'all') {
                setValue(`experience.${index}.bullets`, undo.value, { shouldDirty: true });
              } else {
                setValue(`experience.${index}.bullets.${undo.index}`, undo.value, { shouldDirty: true });
              }
              setUndo(null);
            }}
          >
            Undo rewrite
          </button>
        )}
      </div>
    </div>
  );
}
