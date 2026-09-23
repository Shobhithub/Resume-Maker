import { useFieldArray } from 'react-hook-form';
import { useFormContext } from 'react-hook-form';
import { emptyCertification } from '../../../utils/defaultResume';
import { IconButton, TextInput } from './fields';

export function CertificationsSection() {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' });

  return (
    <div className="space-y-4">
      {fields.length === 0 && <p className="text-sm text-mute">Add certifications you actually hold.</p>}
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-3 rounded-xl border border-line bg-white/70 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{watch(`certifications.${index}.name`) || `Certification ${index + 1}`}</p>
            <IconButton label="Remove certification" tone="danger" onClick={() => remove(index)}>
              Remove
            </IconButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextInput name={`certifications.${index}.name`} label="Name" placeholder="AWS Cloud Practitioner" />
            </div>
            <TextInput name={`certifications.${index}.issuer`} label="Issuer" placeholder="Amazon Web Services" />
            <TextInput name={`certifications.${index}.year`} label="Year" placeholder="2023" hint="YYYY" />
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => append(emptyCertification())}>
        Add certification
      </button>
    </div>
  );
}
