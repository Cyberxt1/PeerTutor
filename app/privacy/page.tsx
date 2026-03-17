import ContentPage from '@/components/layout/content-page';

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Privacy"
      title="A simple overview of how CampusTutor handles user information."
      description="This page explains the kinds of information the platform uses so students and tutors understand what supports the booking experience."
      primaryCta={{ href: '/contact', label: 'Ask a Privacy Question' }}
      sections={[
        {
          title: 'Information used by the platform',
          bullets: [
            'Basic account details such as name, email, and role',
            'Tutor profile data like bio, hourly rate, and selected subjects',
            'Booking details including date, time, and subject',
            'Reviews and ratings submitted after sessions',
          ],
        },
        {
          title: 'Why the information matters',
          body: [
            'Account information helps personalize the experience and route students and tutors to the correct dashboards.',
            'Profile, booking, and review data make it possible to match students with relevant tutors and keep session details organized.',
          ],
        },
        {
          title: 'How information supports trust',
          body: [
            'Visible tutor subjects, ratings, and reviews help students make informed decisions before booking.',
            'Accurate booking records help both sides confirm what was requested and when it is scheduled.',
          ],
        },
        {
          title: 'Questions or concerns',
          body: [
            'If you need clarification about the information shown on your profile or in your account, contact support and include as much context as possible.',
          ],
        },
      ]}
    />
  );
}
