import ContentPage from '@/components/layout/content-page';

export default function ContactPage() {
  return (
    <ContentPage
      eyebrow="Contact"
      title="Need help? Reach out and we’ll point you in the right direction."
      description="Whether you are a student trying to book, or a tutor setting up your profile, CampusTutor support should feel straightforward."
      primaryCta={{ href: 'mailto:support@campustutor.app', label: 'Email Support' }}
      secondaryCta={{ href: '/faqs', label: 'Read FAQs' }}
      sections={[
        {
          title: 'General support',
          description: 'For account and booking questions.',
          bullets: [
            'Email: support@campustutor.app',
            'Response window: within one business day',
            'Best for: login issues, booking problems, and profile questions',
          ],
        },
        {
          title: 'Tutor help',
          description: 'For setup and profile guidance.',
          bullets: [
            'Email: tutors@campustutor.app',
            'Best for: rate setting, subject selection, and profile optimization',
          ],
        },
        {
          title: 'Partnerships and campus programs',
          description: 'For organizations and school partnerships.',
          bullets: [
            'Email: partnerships@campustutor.app',
            'Best for: campus collaborations, student orgs, and pilot programs',
          ],
        },
        {
          title: 'Before you write in',
          body: [
            'Including the email on your account, the page you were using, and the exact issue you saw will help support move faster.',
            'If the issue involved a booking, include the tutor name and the date you selected.',
          ],
        },
      ]}
    />
  );
}
