'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useApp } from '@/lib/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LANDING_THEME_STORAGE_KEY, landingThemeOptions, type LandingThemeName } from '@/lib/landing-theme';
import { cn } from '@/lib/utils';
import { ArrowDown, BookOpen, Clock3, ShieldCheck, Sparkles, Star, Users } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export default function Home() {
  const { currentUser, isAdmin, isLoading, platformSettings } = useApp();
  const mainRef = useRef<HTMLElement | null>(null);
  const featuresRef = useRef<HTMLElement | null>(null);
  const [showMobileScrollPrompt, setShowMobileScrollPrompt] = useState(false);
  const [landingTheme, setLandingTheme] = useState<LandingThemeName>('default');
  const [hasLoadedLandingTheme, setHasLoadedLandingTheme] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !currentUser) return;

    if (isAdmin) {
      router.replace('/addmean');
      return;
    }

    router.replace(currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard');
  }, [currentUser, isAdmin, isLoading, router]);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(LANDING_THEME_STORAGE_KEY);

    if (
      savedTheme === 'default' ||
      savedTheme === 'neon-black' ||
      savedTheme === 'neon-blue'
    ) {
      setLandingTheme(savedTheme);
    }

    setHasLoadedLandingTheme(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedLandingTheme) return;
    window.localStorage.setItem(LANDING_THEME_STORAGE_KEY, landingTheme);
  }, [hasLoadedLandingTheme, landingTheme]);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      mainElement.style.setProperty('--home-scroll', '0');
    }

    const dismissedPrompt = window.sessionStorage.getItem('home-mobile-scroll-prompt-dismissed') === 'true';

    const syncMobilePrompt = () => {
      const isMobile = window.innerWidth < 768;
      const hasScrolled = window.scrollY > 36;

      if (!isMobile || hasScrolled || dismissedPrompt) {
        setShowMobileScrollPrompt(false);
        return;
      }

      setShowMobileScrollPrompt(true);
    };

    syncMobilePrompt();

    if (mediaQuery.matches) {
      window.addEventListener('resize', syncMobilePrompt);
      return () => {
        window.removeEventListener('resize', syncMobilePrompt);
      };
    }

    let frameId = 0;

    const updateScrollValue = () => {
      frameId = 0;
      mainElement.style.setProperty('--home-scroll', String(window.scrollY));
      syncMobilePrompt();
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateScrollValue);
    };

    updateScrollValue();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', syncMobilePrompt);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', syncMobilePrompt);
    };
  }, []);

  const handleMobileScrollPrompt = () => {
    window.sessionStorage.setItem('home-mobile-scroll-prompt-dismissed', 'true');
    setShowMobileScrollPrompt(false);
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const featureCards = [
    {
      title: 'Personalized Learning',
      description: 'One-on-one sessions tailored to your learning style and pace.',
      icon: (
        <Sparkles
          className={cn(
            'h-6 w-6',
            landingTheme === 'default' && 'text-orange-500',
            landingTheme === 'neon-black' && 'text-cyan-300',
            landingTheme === 'neon-blue' && 'text-sky-300'
          )}
        />
      ),
      className:
        landingTheme === 'default'
          ? 'from-orange-50 to-white'
          : landingTheme === 'neon-black'
            ? 'from-cyan-950/70 to-slate-950'
            : 'from-sky-950/70 to-blue-950',
    },
    {
      title: 'Affordable Rates',
      description: 'Save up to 50% compared to traditional tutoring centers.',
      icon: (
        <Star
          className={cn(
            'h-6 w-6',
            landingTheme === 'default' && 'text-blue-500',
            landingTheme === 'neon-black' && 'text-violet-300',
            landingTheme === 'neon-blue' && 'text-blue-300'
          )}
        />
      ),
      className:
        landingTheme === 'default'
          ? 'from-blue-50 to-white'
          : landingTheme === 'neon-black'
            ? 'from-violet-950/70 to-slate-950'
            : 'from-blue-950/80 to-slate-950',
    },
    {
      title: 'Flexible Schedule',
      description: 'Book sessions that fit your timetable, weekdays or weekends.',
      icon: (
        <Clock3
          className={cn(
            'h-6 w-6',
            landingTheme === 'default' && 'text-emerald-500',
            landingTheme === 'neon-black' && 'text-emerald-300',
            landingTheme === 'neon-blue' && 'text-cyan-300'
          )}
        />
      ),
      className:
        landingTheme === 'default'
          ? 'from-emerald-50 to-white'
          : landingTheme === 'neon-black'
            ? 'from-emerald-950/60 to-slate-950'
            : 'from-cyan-950/70 to-blue-950',
    },
    {
      title: 'Verified Tutors',
      description: 'Choose from well-rated tutors with visible social proof.',
      icon: (
        <ShieldCheck
          className={cn(
            'h-6 w-6',
            landingTheme === 'default' && 'text-amber-500',
            landingTheme === 'neon-black' && 'text-fuchsia-300',
            landingTheme === 'neon-blue' && 'text-indigo-300'
          )}
        />
      ),
      className:
        landingTheme === 'default'
          ? 'from-amber-50 to-white'
          : landingTheme === 'neon-black'
            ? 'from-fuchsia-950/60 to-slate-950'
            : 'from-indigo-950/70 to-blue-950',
    },
  ];

  if (currentUser) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <div
      className={cn(
        'landing-shell',
        landingTheme === 'neon-black' && 'landing-shell-neon-black',
        landingTheme === 'neon-blue' && 'landing-shell-neon-blue'
      )}
    >
      <Header variant="landing" />
      <main
        ref={mainRef}
        className="home-parallax min-h-screen bg-gradient-to-b from-background via-background to-muted/20"
      >
        {showMobileScrollPrompt && (
          <button
            type="button"
            onClick={handleMobileScrollPrompt}
            className="home-mobile-scroll-popup md:hidden"
            aria-label="Scroll to explore more content"
          >
            <span className="home-mobile-scroll-icon">
              <ArrowDown className="h-4 w-4" />
            </span>
            <span>Scroll to explore</span>
          </button>
        )}

        <section className="relative overflow-hidden px-4 py-14 sm:py-18 md:py-24 lg:py-32">
          <div className="home-parallax-orb home-parallax-orb-left" />
          <div className="home-parallax-orb home-parallax-orb-right" />
          <div className="home-parallax-grid" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 lg:gap-16">
            <div className="relative z-10 space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Peer-to-peer tutoring that feels personal
              </div>

              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-bold text-foreground text-balance sm:text-5xl lg:text-6xl">
                  Learn with depth, not just speed.
                </h1>
                <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
                  Connect with experienced student tutors, book by subject, and get support that matches exactly what you need to master.
                </p>
              </div>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                {currentUser ? (
                  <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                    <Link href={currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard'}>
                      Go to Dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    asChild={platformSettings.allowTutorBrowsing}
                    className="bg-primary hover:bg-primary/90"
                    disabled={!platformSettings.allowTutorBrowsing}
                  >
                    {platformSettings.allowTutorBrowsing ? (
                      <Link href="/auth/login">Find Tutors</Link>
                    ) : (
                      <span>Tutor Browsing Paused</span>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid max-w-xl gap-4 pt-6 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">4.8+ average rating</p>
                  <p className="mt-1 text-xs text-muted-foreground">Trusted by returning students</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Focused tutor matches</p>
                  <p className="mt-1 text-xs text-muted-foreground">Choose from subject-specific profiles</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Flexible sessions</p>
                  <p className="mt-1 text-xs text-muted-foreground">Book around your study schedule</p>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="home-parallax-device home-parallax-backdrop" />

              <div className="home-parallax-card home-parallax-card-back">
                <div className="home-showcase-panel home-showcase-panel-back rounded-[2rem] border p-6 shadow-xl backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="home-showcase-muted text-sm font-medium">This week</p>
                    <span className="home-showcase-success rounded-full px-3 py-1 text-xs font-semibold">
                      +12 bookings
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="home-showcase-stat rounded-2xl p-4">
                      <p className="home-showcase-muted text-xs uppercase tracking-[0.18em]">Popular subjects</p>
                      <p className="home-showcase-title mt-2 text-lg font-semibold">Math, Physics, Writing</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="home-showcase-block home-showcase-block-primary h-20 flex-1 rounded-2xl" />
                      <div className="home-showcase-block home-showcase-block-secondary h-20 w-24 rounded-2xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="home-parallax-card home-parallax-card-front">
                <div className="home-showcase-panel home-showcase-panel-front rounded-[2rem] border p-6 shadow-2xl backdrop-blur">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Featured tutor</p>
                      <p className="text-xl font-semibold text-foreground">Sarah Chen</p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      4.9
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="home-showcase-highlight rounded-2xl p-4">
                      <p className="text-sm font-medium text-foreground">Subjects</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="home-showcase-pill rounded-full px-3 py-1 text-sm shadow-sm">Mathematics</span>
                        <span className="home-showcase-pill rounded-full px-3 py-1 text-sm shadow-sm">Computer Science</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Rate</p>
                        <p className="mt-2 text-2xl font-bold text-foreground">$35</p>
                        <p className="text-sm text-muted-foreground">per hour</p>
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Availability</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">Mon, Wed, Fri</p>
                        <p className="text-sm text-muted-foreground">Afternoons</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                      <p className="text-sm font-medium text-foreground">Booking flow</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Students choose the exact subject they need before sending a request.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section ref={featuresRef} className="relative px-4 py-12 sm:py-16 md:py-24">
          <div className="home-parallax-glow" />
          <div className="relative mx-auto max-w-6xl">
            <div className="mb-12 text-center space-y-4 md:mb-16">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                Why Choose CampusTutor?
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                We connect students with experienced peer tutors for focused, personalized learning.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((card, index) => (
                <Card
                  key={card.title}
                  className={`home-feature-card home-parallax-feature border-0 bg-gradient-to-br ${card.className} shadow-sm`}
                  style={{ ['--feature-depth' as string]: `${index + 1}` }}
                >
                  <CardHeader className="pb-3">
                    <div className="home-feature-icon-shell mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm">
                      {card.icon}
                    </div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-foreground/70">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <Card className="home-parallax-cta border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="mb-4 text-3xl sm:text-4xl">Ready to Start Learning?</CardTitle>
                <CardDescription className="text-lg">
                  {currentUser
                    ? 'Explore available tutors and book your next session with confidence.'
                    : 'Join thousands of students improving their grades with peer tutoring.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {currentUser ? (
                  <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/search-tutors">Browse Tutors</Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    asChild={platformSettings.allowTutorBrowsing}
                    className="bg-primary hover:bg-primary/90"
                    disabled={!platformSettings.allowTutorBrowsing}
                  >
                    {platformSettings.allowTutorBrowsing ? (
                      <Link href="/auth/login">Browse Tutors</Link>
                    ) : (
                      <span>Tutor Browsing Paused</span>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer
        variant="landing"
        landingTheme={landingTheme}
        landingThemeOptions={landingThemeOptions}
        onLandingThemeChange={setLandingTheme}
      />
    </div>
  );
}
