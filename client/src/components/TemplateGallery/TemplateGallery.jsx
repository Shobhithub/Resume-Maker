import { useFormContext } from 'react-hook-form';
import { templates } from '../../templates/templateRegistry';
import '../../templates/templateStyles.css';

export function TemplateGallery({ resume }) {
  const { setValue, watch } = useFormContext();
  const active = watch('templateId');

  return (
    <section className="rounded-2xl border border-line bg-card/90 p-3 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="text-sm font-medium text-ink">Templates</h2>
        <p className="text-[11px] uppercase tracking-[0.14em] text-mute">Single column</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {templates.map((template) => {
          const selected = template.id === active;
          const Sheet = template.Component;
          return (
            <button
              key={template.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setValue('templateId', template.id, { shouldDirty: true, shouldValidate: true })}
              className={`min-w-0 rounded-xl border p-1.5 text-left transition ${
                selected ? 'border-ink bg-white shadow-sm' : 'border-transparent hover:border-line hover:bg-white/70'
              }`}
            >
              <div className="h-24 overflow-hidden rounded-md border border-line bg-white">
                <div className="pointer-events-none origin-top-left" style={{ transform: 'scale(0.16)', width: '8.5in' }}>
                  <Sheet resume={resume} />
                </div>
              </div>
              <span className="mt-2 block px-0.5 text-xs font-medium text-ink">{template.name}</span>
              <span className="block px-0.5 text-[11px] text-mute">{template.font}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 px-1 text-xs leading-relaxed text-mute">
        {templates.find((template) => template.id === active)?.description} No tables, icons, images, or columns.
      </p>
    </section>
  );
}
