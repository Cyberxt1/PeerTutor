import ContentPage from '@/components/layout/content-page';

export default function HowItWorksPage() {
  return (
    <ContentPage
      eyebrow="How It Works"
      title="A simple path from searching to session success."
      description="CampusTutor is designed to help students find the right peer tutor quickly, book confidently, and keep everything organized in one place."
      primaryCta={{ href: '/search-tutors', label: 'Browse Tutors' }}
      secondaryCta={{ href: '/auth/signup', label: 'Create an Account' }}
      sections={[
        {
          title: '1. Discover tutors',
          description: 'Search by subject, name, and rating.',
          body: [
            'Students can explore tutor profiles, compare teaching specialties, and review pricing before making a decision.',
            'Each profile highlights the tutor’s subjects, availability, bio, and recent student feedback.',
          ],
        },
        {
          title: '2. Book the right subject',
          description: 'Choose the exact help you need.',
          body: [
            'When you book a tutor, you select one of the subjects that tutor actually teaches, along with your preferred date and time.',
            'That keeps requests clearer for both sides and makes approval much faster.',
          ],
        },
        {
          title: '3. Manage everything in one dashboard',
          description: 'Track requests, sessions, and reviews.',
          bullets: [
            'Students can monitor bookings, view upcoming sessions, and leave reviews after completed lessons.',
            'Tutors can approve requests, manage their profile, and keep track of student activity.',
          ],
        },
        {
          title: '4. Keep improving',
          description: 'Feedback helps everyone.',
          body: [
            'Reviews help future students choose confidently and help tutors refine how they teach.',
            'Over time, the platform gets stronger because each session adds useful context for the next learner.',
          ],
        },
      ]}
    />
  );
}
