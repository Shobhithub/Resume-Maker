import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { AchievementsSection } from './sections/AchievementsSection';
import { CertificationsSection } from './sections/CertificationsSection';
import { ContactSection } from './sections/ContactSection';
import { EducationSection } from './sections/EducationSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { SectionCard } from './sections/SectionCard';
import { SkillsSection } from './sections/SkillsSection';
import { SummarySection } from './sections/SummarySection';
import { cleanList, hasText } from '../../utils/text';

const INITIAL_OPEN = {
  contact: true,
  summary: true,
  experience: true,
  projects: false,
  education: false,
  skills: false,
  certifications: false,
  achievements: false,
};

export function BuilderForm() {
  const { watch } = useFormContext();
  const resume = watch();
  const [open, setOpen] = useState(INITIAL_OPEN);

  function toggle(id) {
    setOpen((current) => ({ ...current, [id]: !current[id] }));
  }

  const experienceCount = (resume.experience || []).filter((item) => hasText(item?.role) || hasText(item?.company)).length;
  const projectCount = (resume.projects || []).filter((item) => hasText(item?.name)).length;
  const educationCount = (resume.education || []).filter((item) => hasText(item?.school) || hasText(item?.degree)).length;
  const skillCount = Object.values(resume.skills || {}).reduce((sum, list) => sum + cleanList(list).length, 0);

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => event.preventDefault()}
      noValidate
    >
      <SectionCard
        title="Contact"
        hint={resume.contact?.name || 'Name, email, and links'}
        open={open.contact}
        onToggle={() => toggle('contact')}
      >
        <ContactSection />
      </SectionCard>
      <SectionCard
        title="Summary"
        hint={hasText(resume.summary) ? `${resume.summary.trim().length} characters` : 'A short professional snapshot'}
        open={open.summary}
        onToggle={() => toggle('summary')}
      >
        <SummarySection />
      </SectionCard>
      <SectionCard
        title="Experience"
        hint={experienceCount ? `${experienceCount} role${experienceCount === 1 ? '' : 's'}` : 'Roles and bullets'}
        open={open.experience}
        onToggle={() => toggle('experience')}
      >
        <ExperienceSection />
      </SectionCard>
      <SectionCard
        title="Projects"
        hint={projectCount ? `${projectCount} project${projectCount === 1 ? '' : 's'}` : 'Optional'}
        open={open.projects}
        onToggle={() => toggle('projects')}
      >
        <ProjectsSection />
      </SectionCard>
      <SectionCard
        title="Education"
        hint={educationCount ? `${educationCount} entr${educationCount === 1 ? 'y' : 'ies'}` : 'Degrees and programs'}
        open={open.education}
        onToggle={() => toggle('education')}
      >
        <EducationSection />
      </SectionCard>
      <SectionCard
        title="Skills"
        hint={skillCount ? `${skillCount} listed` : 'Plain labeled lines'}
        open={open.skills}
        onToggle={() => toggle('skills')}
      >
        <SkillsSection />
      </SectionCard>
      <SectionCard
        title="Certifications"
        hint={`${(resume.certifications || []).length} listed`}
        open={open.certifications}
        onToggle={() => toggle('certifications')}
      >
        <CertificationsSection />
      </SectionCard>
      <SectionCard
        title="Achievements"
        hint={`${cleanList(resume.achievements).length} listed`}
        open={open.achievements}
        onToggle={() => toggle('achievements')}
      >
        <AchievementsSection />
      </SectionCard>
    </form>
  );
}
