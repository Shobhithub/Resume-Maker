export function SectionCard({ title, hint, open, onToggle, children, action }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card/90 shadow-sm">
      <div className="flex items-center">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={open}
          onClick={onToggle}
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">{title}</span>
            {hint && <span className="mt-0.5 block truncate text-xs text-mute">{hint}</span>}
          </span>
          <Chevron open={open} />
        </button>
        {action}
      </div>
      {open && <div className="space-y-3 border-t border-line px-4 py-4">{children}</div>}
    </section>
  );
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-mute transition ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
