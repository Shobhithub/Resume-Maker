import { useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { splitList } from '../../../utils/text';

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{label}</span>
        {hint && <span className="text-[11px] text-mute/80">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-accent">{error}</span>}
    </label>
  );
}

export function TextInput({ name, label, placeholder, hint, type = 'text' }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = pathError(errors, name);
  return (
    <Field label={label} hint={hint} error={error}>
      <input className="field-input" type={type} placeholder={placeholder} {...register(name)} />
    </Field>
  );
}

export function TextArea({ name, label, placeholder, rows = 4, hint }) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  return (
    <Field label={label} hint={hint} error={pathError(errors, name)}>
      <textarea className="field-input resize-y leading-relaxed" rows={rows} placeholder={placeholder} {...register(name)} />
    </Field>
  );
}

export function CommaListInput({ value, onChange, placeholder }) {
  const [text, setText] = useState((value || []).join(', '));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText((value || []).join(', '));
  }, [value]);

  return (
    <input
      className="field-input"
      placeholder={placeholder}
      value={text}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        onChange(splitList(next));
      }}
      onBlur={() => {
        focused.current = false;
        const items = splitList(text);
        setText(items.join(', '));
        onChange(items);
      }}
    />
  );
}

export function SkillInput({ name, label }) {
  const { watch, setValue } = useFormContext();
  const value = watch(name) || [];
  return (
    <Field label={label} hint="Comma separated">
      <CommaListInput
        value={value}
        placeholder="Add a few, separated by commas"
        onChange={(next) => setValue(name, next, { shouldDirty: true, shouldValidate: true })}
      />
    </Field>
  );
}

export function EndDateInput({ name, label, yearOnly = false }) {
  const { register, setValue, watch } = useFormContext();
  const value = watch(name) || '';
  const isPresent = /^present$/i.test(value);
  return (
    <Field label={label} hint={yearOnly ? 'YYYY' : 'YYYY-MM'}>
      <div className="flex gap-2">
        <input
          className="field-input"
          placeholder={yearOnly ? '2020' : '2022-03'}
          disabled={isPresent}
          {...register(name)}
        />
        <button
          type="button"
          className={isPresent ? 'btn-primary shrink-0 px-3' : 'btn-secondary shrink-0 px-3'}
          onClick={() => setValue(name, isPresent ? '' : 'Present', { shouldDirty: true, shouldValidate: true })}
        >
          Present
        </button>
      </div>
    </Field>
  );
}

export function pathError(errors, name) {
  return String(name)
    .split('.')
    .reduce((node, key) => node?.[key], errors)?.message;
}

export function IconButton({ label, onClick, children, disabled, tone = 'ghost' }) {
  const toneClass = tone === 'danger' ? 'btn-danger' : 'btn-ghost';
  return (
    <button type="button" className={toneClass} onClick={onClick} disabled={disabled} aria-label={label} title={label}>
      {children}
    </button>
  );
}
