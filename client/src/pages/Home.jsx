import { Link } from 'react-router-dom';
import { Classic1 } from '../templates/classic-1';
import { defaultResume } from '../utils/defaultResume';
import '../templates/templateStyles.css';

const POINTS = [
  {
    index: '01',
    title: 'Three plain templates',
    body: 'Classic, Traditional, and Compact. One column, standard headings, Calibri, Times, or Arial. No tables, icons, images, or skill bars.',
  },
  {
    index: '02',
    title: 'Rewrite without fiction',
    body: 'Summary and bullets can be tightened for a target role. The rewriter will not invent employers, dates, tools, or metrics. Missing numbers stay placeholders.',
  },
  {
    index: '03',
    title: 'Export, then leave',
    body: 'Download a PDF of the selected template or a DOCX with headings and bullets. The draft lives in this browser. No account.',
  },
];

export function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Wordmark />
        <Link to="/builder" className="btn-primary">
          Create resume
        </Link>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-10">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-accent">ATS-safe resume studio</p>
            <h1 className="mt-4 max-w-xl font-display text-[3.1rem] font-medium leading-[0.98] text-ink sm:text-6xl">
              A resume that still reads when the design is gone.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
              Plainpage keeps the page in a single column and the language in your own facts. Shape the draft, switch templates, rewrite carefully, then export PDF or DOCX.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/builder" className="btn-primary px-5 py-2.5">
                Create resume
              </Link>
              <a href="#method" className="btn-secondary px-5 py-2.5">
                How it stays plain
              </a>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-8 border-t border-line pt-6">
              {[
                ['3', 'Templates'],
                ['0', 'Accounts'],
                ['2', 'Exports'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dd className="font-display text-4xl leading-none text-ink">{value}</dd>
                  <dt className="mt-2 text-sm text-mute">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-accent/10 blur-2xl lg:block" />
            <div className="overflow-hidden rounded-[28px] border border-line bg-[#e9e2d6] p-4 shadow-sheet sm:p-6">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-mute">
                <span>Sample · Classic</span>
                <span>Not your data</span>
              </div>
              <div className="relative overflow-hidden rounded-md bg-white shadow-sheet" style={{ height: 560 }}>
                <div className="origin-top-left" style={{ transform: 'scale(0.62)', width: '8.5in' }}>
                  <Classic1 resume={defaultResume} />
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#e9e2d6] to-transparent" />
              </div>
            </div>
          </div>
        </section>

        <section id="method" className="border-t border-line/80 bg-white/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
            {POINTS.map((point) => (
              <article key={point.index}>
                <p className="font-display text-2xl text-accent">{point.index}</p>
                <h2 className="mt-3 text-lg font-medium text-ink">{point.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mute">{point.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] border border-line bg-ink px-6 py-8 text-paper sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="font-display text-4xl leading-none">Start from a sample, or a blank page.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/70">
                The builder opens with a sample so the templates are visible. Reset returns to that sample. Start blank if you would rather type into an empty draft. Both stay in local storage on this browser.
              </p>
            </div>
            <Link to="/builder" className="btn-secondary border-paper/20 bg-paper text-ink hover:bg-white">
              Open the builder
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 py-8 text-xs text-mute">
        <span>Plainpage</span>
        <span>Single column. No login.</span>
      </footer>
    </div>
  );
}

export function Wordmark() {
  return (
    <Link to="/" className="group inline-flex items-baseline gap-2">
      <span className="font-display text-[1.7rem] italic leading-none text-ink">Plainpage</span>
      <span className="hidden text-[11px] uppercase tracking-[0.16em] text-mute sm:inline">Resume</span>
    </Link>
  );
}
