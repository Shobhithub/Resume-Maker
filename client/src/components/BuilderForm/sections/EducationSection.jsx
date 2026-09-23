import { useFieldArray, useFormContext } from 'react-hook-form';
import { emptyEducation } from '../../../utils/defaultResume';
import { EndDateInput, IconButton, TextInput } from './fields';

export function EducationSection() {
  const { control } = useFormContext();
  const { fields, append, remove, swap } = useFieldArray({ control, name: 'education' });

  return (
    <div className="space-y-4">
      {fields.length === 0 && <p className="text-sm text-mute">Add degrees or programs you completed or are in.</p>}
      {fields.map((field, index) => (
        <EducationCard
          key={field.id}
          index={index}
          total={fields.length}
          onRemove={() => remove(index)}
          onMove={(dir) => swap(index, index + dir)}
        />
      ))}
      <button type="button" className="btn-secondary" onClick={() => append(emptyEducation())}>
        Add education
      </button>
    </div>
  );
}

function EducationCard({ index, total, onRemove, onMove }) {
  const { watch } = useFormContext();
  return (
    <div className="space-y-3 rounded-xl border border-line bg-white/70 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{watch(`education.${index}.school`) || `School ${index + 1}`}</p>
        <div className="flex">
          <IconButton label="Move education up" disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </IconButton>
          <IconButton label="Move education down" disabled={index === total - 1} onClick={() => onMove(1)}>
            Down
          </IconButton>
          <IconButton label="Remove education" tone="danger" onClick={onRemove}>
            Remove
          </IconButton>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextInput name={`education.${index}.school`} label="School" placeholder="University name" />
        <TextInput name={`education.${index}.degree`} label="Degree" placeholder="B.Tech, Computer Science" />
        <TextInput name={`education.${index}.location`} label="Location" placeholder="City" />
        <TextInput name={`education.${index}.score`} label="Score" placeholder="8.2 CGPA" hint="Optional" />
        <TextInput name={`education.${index}.start`} label="Start" placeholder="2016" hint="YYYY" />
        <EndDateInput name={`education.${index}.end`} label="End" yearOnly />
      </div>
    </div>
  );
}
