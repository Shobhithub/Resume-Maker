import { entryHasContent, hasText } from '../utils/text';
import {
  AchievementsBlock,
  BulletList,
  CertificationsBlock,
  Dates,
  ResumeHeader,
  SkillsBlock,
  SummaryBlock,
  TechLine,
} from './parts';

export function Classic1({ resume }) {
  return (
    <article className="resume-page rs-classic-1" data-template="classic-1">
      <ResumeHeader resume={resume} />
      <SummaryBlock summary={resume.summary} />
      <Experience resume={resume} />
      <Projects resume={resume} />
      <Education resume={resume} />
      <SkillsBlock skills={resume.skills} />
      <CertificationsBlock items={resume.certifications} />
      <AchievementsBlock items={resume.achievements} />
    </article>
  );
}

function Experience({ resume }) {
  const items = (resume.experience || []).filter((item) =>
    entryHasContent(item, ['company', 'role', 'location', 'start', 'end', 'bullets', 'tech']),
  );
  if (!items.length) return null;
  return (
    <section>
      <h2>Experience</h2>
      {items.map((item, index) => (
        <div className="entry" key={`${item.company}-${item.role}-${index}`}>
          <div className="entry-head">
            <p className="entry-title">
              <span className="role">{item.role || 'Role'}</span>
              <span className="org">
                {[item.company, item.location].filter(hasText).join(' · ')}
              </span>
            </p>
            <Dates start={item.start} end={item.end} />
          </div>
          <BulletList bullets={item.bullets} />
          <TechLine tech={item.tech} />
        </div>
      ))}
    </section>
  );
}

function Projects({ resume }) {
  const items = (resume.projects || []).filter((item) =>
    entryHasContent(item, ['name', 'link', 'bullets', 'tech']),
  );
  if (!items.length) return null;
  return (
    <section>
      <h2>Projects</h2>
      {items.map((item, index) => (
        <div className="entry" key={`${item.name}-${index}`}>
          <div className="entry-head">
            <p className="entry-title">
              <span className="role">{item.name || 'Project'}</span>
              {hasText(item.link) && <span className="org">{item.link.trim()}</span>}
            </p>
          </div>
          <BulletList bullets={item.bullets} />
          <TechLine tech={item.tech} />
        </div>
      ))}
    </section>
  );
}

function Education({ resume }) {
  const items = (resume.education || []).filter((item) =>
    entryHasContent(item, ['school', 'degree', 'location', 'start', 'end', 'score']),
  );
  if (!items.length) return null;
  return (
    <section>
      <h2>Education</h2>
      {items.map((item, index) => (
        <div className="entry" key={`${item.school}-${index}`}>
          <div className="entry-head">
            <p className="entry-title">
              <span className="role">{item.degree || item.school || 'Education'}</span>
              <span className="org">{[item.degree ? item.school : '', item.location].filter(hasText).join(' · ')}</span>
            </p>
            <Dates start={item.start} end={item.end} />
          </div>
          {hasText(item.score) && <p className="score">{item.score.trim()}</p>}
        </div>
      ))}
    </section>
  );
}

