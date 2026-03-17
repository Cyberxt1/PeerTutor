'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Header from '@/components/layout/header';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { isAdminUser } from '@/lib/platform';
import { AlertCircle, ArrowRightLeft, BookOpen, CheckCircle2, Loader2, MoonStar, UserRound } from 'lucide-react';

const MODE_SWITCH_NOTICE_KEY = 'campustutor-mode-switch-notice';

export default function SettingsPage() {
  const { currentUser, isLoading, reviews, getTutorByUserId, getBookings, updateUserProfile, switchUserRole } =
    useApp();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    if (currentUser && isAdminUser(currentUser)) {
      router.replace('/addmean');
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser) return;

    setName(currentUser.name || '');
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
  }, [currentUser]);

  useEffect(() => {
    setIsThemeReady(true);
  }, []);

  const tutorProfile = currentUser ? getTutorByUserId(currentUser.id) : undefined;
  const bookings = currentUser ? getBookings(currentUser.id, currentUser.role) : [];
  const writtenReviews = useMemo(() => {
    if (!currentUser) return [];
    return reviews.filter((review) => review.studentId === currentUser.id);
  }, [currentUser, reviews]);

  const detailRows = useMemo(() => {
    if (!currentUser) return [];

    const commonRows = [
      { label: 'Current mode', value: currentUser.role === 'tutor' ? 'Tutor' : 'Learner' },
      { label: 'Email address', value: currentUser.email },
      { label: 'Phone number', value: currentUser.phone || 'Not added yet' },
      { label: 'Member since', value: new Date(currentUser.createdAt).toLocaleDateString() },
    ];

    if (currentUser.role === 'tutor') {
      return [
        ...commonRows,
        { label: 'Courses listed', value: tutorProfile?.courses.length?.toString() || '0' },
        { label: 'Hourly rate', value: tutorProfile ? `NGN ${tutorProfile.hourlyRate.toLocaleString()}/hr` : 'Not set' },
        { label: 'Verification', value: tutorProfile?.verificationStatus || 'Pending' },
      ];
    }

    return [
      ...commonRows,
      { label: 'Bookings made', value: bookings.length.toString() },
      { label: 'Reviews written', value: writtenReviews.length.toString() },
      { label: 'Learning focus', value: bio || 'Add a short note about what you are learning.' },
    ];
  }, [bio, bookings.length, currentUser, tutorProfile, writtenReviews.length]);

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    setMessage('');

    try {
      await updateUserProfile({
        name,
        email,
        phone,
        bio,
      });

      setMessageType('success');
      setMessage('Your settings were updated successfully.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'We could not save your settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = async () => {
    if (!currentUser) return;

    const nextRole = currentUser.role === 'tutor' ? 'student' : 'tutor';

    setSwitching(true);
    setMessage('');

    try {
      await switchUserRole(nextRole);
      const nextModeLabel = nextRole === 'tutor' ? 'Tutor' : 'Learner';

      sessionStorage.setItem(MODE_SWITCH_NOTICE_KEY, nextModeLabel);
      router.replace(nextRole === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'We could not switch your account mode right now.');
    } finally {
      setSwitching(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </main>
      </>
    );
  }

  const isTutor = currentUser.role === 'tutor';
  const isAdmin = isAdminUser(currentUser);
  const isDarkMode = resolvedTheme === 'dark';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col gap-3 mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Settings</p>
            <h1 className="text-4xl font-bold text-foreground">Your account at a glance</h1>
            <p className="text-muted-foreground max-w-2xl">
              Keep your brief details up to date, review your current mode, and switch between learning and tutoring from one place.
            </p>
          </div>

          {message && (
            <Alert variant={messageType === 'success' ? 'default' : 'destructive'} className="mb-6">
              {messageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>These are the brief details shown across your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{currentUser.name}</p>
                      <p className="text-sm text-muted-foreground">{isTutor ? 'Tutor account' : 'Learner account'}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input value={name} onChange={(e) => setName(e.target.value)} disabled={loading || switching} />
                    </Field>
                    <Field>
                      <FieldLabel>Email Address</FieldLabel>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading || switching} />
                    </Field>
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add a contact number" disabled={loading || switching} />
                    </Field>
                    <Field>
                      <FieldLabel>Account Mode</FieldLabel>
                      <Input value={isTutor ? 'Tutor' : 'Learner'} disabled />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel>Short Bio</FieldLabel>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      placeholder={isTutor ? 'Summarize how you teach and what students can expect.' : 'Share what you are currently learning and where you need support.'}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading || switching}
                    />
                  </Field>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => void handleSave()} className="bg-primary hover:bg-primary/90" disabled={loading || switching}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                    {isTutor ? (
                      <Button variant="outline" asChild>
                        <Link href="/tutor/profile">Manage Tutor Profile</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" asChild>
                        <Link href="/search-tutors">Browse Tutors</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Choose how your dashboard looks while you study or teach.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MoonStar className="h-5 w-5 text-primary" />
                        <p className="font-medium text-foreground">Dark Mode</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Turn on a darker dashboard theme for low-light use.
                      </p>
                    </div>

                    <Switch
                      checked={isThemeReady ? isDarkMode : false}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      aria-label="Toggle dark mode"
                      disabled={!isThemeReady}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brief Details</CardTitle>
                  <CardDescription>A quick outline of your current account information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailRows.map((detail) => (
                    <div key={detail.label} className="flex items-start justify-between gap-4 border-b border-border/70 pb-3 last:border-b-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{detail.label}</span>
                      <span className="text-sm font-medium text-right text-foreground">{detail.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>{isAdmin ? 'Admin Access Only' : isTutor ? 'Want to learn too?' : 'Ready to tutor too?'}</CardTitle>
                  <CardDescription>
                    {isAdmin
                      ? 'The configured admin account stays outside the tutor and learner marketplace.'
                      : isTutor
                      ? 'Switch into learner mode and start booking support from other tutors.'
                      : 'Switch into tutor mode and set up your tutoring profile with the same account.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-primary/15 bg-background/70 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <p className="font-medium text-foreground">
                        {isAdmin ? 'Use the Admin Control Center' : isTutor ? 'Learn on CampusTutor' : 'Tutor on CampusTutor'}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isAdmin
                        ? 'This account can manage the platform, post updates, and review users, but it cannot become a tutor or book tutors.'
                        : isTutor
                        ? 'You will move into learner mode and can immediately browse tutors and request sessions.'
                        : 'You will move into tutor mode, get a tutor profile if you do not already have one, and can start setting up what you teach.'}
                    </p>
                  </div>

                  {isAdmin ? (
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                      <Link href="/addmean">Open Admin Control Center</Link>
                    </Button>
                  ) : (
                    <Button onClick={() => void handleRoleSwitch()} className="w-full bg-primary hover:bg-primary/90" disabled={loading || switching}>
                      {switching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Switching...
                        </>
                      ) : (
                        <>
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          {isTutor ? 'Learn' : 'Tutor'}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
