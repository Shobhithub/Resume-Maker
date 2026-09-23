import { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { useRewrite } from '../../AiRewritePanel/useRewrite';
import { emptyProject } from '../../../utils/defaultResume';
import { CommaListInput, IconButton, TextInput } from './fields';

export function ProjectsSection() {
  const { control } = useFormContext();
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'projects' });

  return (
    <div className="space-y-4">
      {fields.length === 0 && <p className="text-sm text-mute">Projects are optional. Add ones you can describe.</p>}
      {fields.map((field, index) => (
        <ProjectCard
          key={field.id}
          index={index}
          total={fields.length}
          onRemove={() => remove(index)}
          onMove={(dir) => swap(index, index + dir)}
        />
      ))}
      <button type="button" className="btn-secondary" onClick={() => append(emptyProject())}>
        Add project
      </button>
    </div>
  );
}

function ProjectCard({ index, total, onRemove, onMove }) {
  const { register, setValue, watch, getValues } = useFormContext();
  const bulletValues = watch(`projects.${index}.bullets`) || [''];
  const { rewrite, aiBusy } = useRewrite();
  const [undo, setUndo] = useState(null);
  const tech = watch(`projects.${index}.tech`) || [];

  return (
    <div className="space-y-3 rounded-xl border border-line bg-white/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{watch(`projects.${index}.name`) || `Project ${index + 1}`}</p>
        <div className="flex">
          <IconButton label="Move project up" disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </IconButton>
          <IconButton label="Move project down" disabled={index === total - 1} onClick={() => onMove(1)}>
            Down
          </IconButton>
          <IconButton label="Remove project" tone="danger" onClick={onRemove}>
            Remove
          </IconButton>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput name={`projects.${index}.name`} label="Name" placeholder="Trailnotes" />
        <TextInput name={`projects.${index}.link`} label="Link" placeholder="github.com/you/project" />
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-mute">Technologies</span>
        <CommaListInput
          value={tech}
          placeholder="React, Node.js"
          onChange={(next) => setValue(`projects.${index}.tech`, next, { shouldDirty: true })}
        />
      </label>
      <div className="space-y-2">
        {bulletValues.map((bullet, bulletIndex) => (
          <div key={`${index}-pbullet-${bulletIndex}`} className="flex items-start gap-1">
            <textarea
              rows={2}
              className="field-input min-h-[64px] flex-1 resize-y"
              placeholder="What the project does, and what you built."
              {...register(`projects.${index}.bullets.${bulletIndex}`)}
            />
            <div className="flex flex-col">
              <IconButton
                label="Improve bullet"
                disabled={aiBusy || !String(bullet || '').trim()}
                onClick={async () => {
                  const path = `projects.${index}.bullets.${bulletIndex}`;
                  const current = getValues(path) || '';
                  setUndo({ index: bulletIndex, value: current });
                  await rewrite({
                    mode: 'bullet',
                    text: current,
                    maxChars: 280,
                    apply: (next) => setValue(path, next, { shouldDirty: true, shouldValidate: true }),
                  });
                }}
              >
                Improve
              </IconButton>
              <IconButton
                label="Remove bullet"
                tone="danger"
                disabled={bulletValues.length <= 1}
                onClick={() => {
                  const next = (getValues(`projects.${index}.bullets`) || []).filter((_, itemIndex) => itemIndex !== bulletIndex);
                  setValue(`projects.${index}.bullets`, next.length ? next : [''], { shouldDirty: true });
                }}
              >
                Remove
              </IconButton>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const current = getValues(`projects.${index}.bullets`) || [];
              setValue(`projects.${index}.bullets`, [...current, ''], { shouldDirty: true });
            }}
          >
            Add bullet
          </button>
          {undo && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setValue(`projects.${index}.bullets.${undo.index}`, undo.value, { shouldDirty: true });
                setUndo(null);
              }}
            >
              Undo rewrite
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
