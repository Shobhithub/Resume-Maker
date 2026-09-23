import { TextInput } from './fields';

export function ContactSection() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextInput name="contact.name" label="Full name" placeholder="Ananya Sharma" />
      </div>
      <TextInput name="contact.email" label="Email" type="email" placeholder="you@email.com" />
      <TextInput name="contact.phone" label="Phone" placeholder="+91 98100 11223" />
      <TextInput name="contact.location" label="Location" placeholder="City, Country" />
      <TextInput name="contact.linkedin" label="LinkedIn" placeholder="linkedin.com/in/you" />
      <TextInput name="contact.github" label="GitHub" placeholder="github.com/you" />
      <TextInput name="contact.portfolio" label="Portfolio" placeholder="yoursite.dev" />
    </div>
  );
}
