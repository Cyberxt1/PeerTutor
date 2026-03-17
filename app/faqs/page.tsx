import ContentPage from '@/components/layout/content-page';

export default function FaqsPage() {
  return (
    <ContentPage
      eyebrow="FAQs"
      title="Answers to the questions students and tutors ask most."
      description="These are the practical details behind how CampusTutor works today, from booking flow to tutor setup."
      primaryCta={{ href: '/search-tutors', label: 'Find a Tutor' }}
      secondaryCta={{ href: '/contact', label: 'Contact Support' }}
      sections={[
        {
          title: 'How do I book a tutor?',
          body: [
            'Open a tutor profile, click the booking panel, choose one of the subjects that tutor teaches, then pick your preferred date and time.',
            'Your request is saved as pending until the tutor confirms it.',
          ],
        },
        {
          title: 'Can tutors teach multiple subjects?',
          body: [
            'Yes. Tutors can list multiple subjects on their profile, and students can choose the exact one they need when booking.',
          ],
        },
        {
          title: 'How do reviews work?',
          body: [
            'After a completed session, students can leave a rating and optional written feedback.',
            'That feedback contributes to the tutor’s overall rating and helps future students choose well.',
          ],
        },
        {
          title: 'What happens after I sign up as a tutor?',
          body: [
            'A tutor profile is created for you automatically so you can set your bio, rate, and subjects right away.',
            'From there, you can start receiving requests as students discover your profile.',
          ],
        },
      ]}
    />
  );
}
