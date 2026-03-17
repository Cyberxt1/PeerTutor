import ContentPage from '@/components/layout/content-page';

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="About CampusTutor"
      title="Built around peer learning, trust, and academic momentum."
      description="CampusTutor connects students with fellow learners who can explain difficult material in relatable, practical ways."
      primaryCta={{ href: '/search-tutors', label: 'Meet Tutors' }}
      secondaryCta={{ href: '/how-it-works', label: 'See How It Works' }}
      sections={[
        {
          title: 'Why peer tutoring works',
          body: [
            'Students often learn best from someone who remembers what it feels like to struggle through the same material recently.',
            'That shared context makes explanations clearer, examples more relevant, and sessions more approachable.',
          ],
        },
        {
          title: 'What we value',
          bullets: [
            'Clarity over jargon',
            'Affordable, flexible learning support',
            'Trust built through visible reviews and verified profiles',
            'Better academic outcomes through consistent help',
          ],
        },
        {
          title: 'Who CampusTutor serves',
          body: [
            'Students looking for subject support, exam prep, study accountability, or a clearer explanation than they got the first time around.',
            'Tutors who want to share what they know, help their peers, and earn flexible income in the process.',
          ],
        },
        {
          title: 'Where we are headed',
          body: [
            'The goal is a platform where discovering the right tutor, booking confidently, and building academic momentum all feel natural.',
            'Every improvement we make is meant to reduce friction and make learning support easier to access.',
          ],
        },
      ]}
    />
  );
}
