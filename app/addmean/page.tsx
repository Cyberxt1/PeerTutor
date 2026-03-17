'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BellRing,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { useApp } from '@/lib/context';
import { ADMIN_EMAIL, type PlatformSettings } from '@/lib/platform';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { PlatformUpdate } from '@/lib/types';

type AdminToggleKey = Exclude<keyof PlatformSettings, 'adminEmail'>;

const featureToggleLabels: Array<{
  key: AdminToggleKey;
  title: string;
  description: string;
}> = [
  {
    key: 'allowNewSignups',
    title: 'Allow new signups',
    description: 'Turn account creation on or off across the platform.',
  },
  {
    key: 'allowTutorBrowsing',
    title: 'Allow tutor browsing',
    description: 'Control whether tutor search and tutor profile browsing stay open.',
  },
  {
    key: 'allowBookings',
    title: 'Allow bookings',
    description: 'Pause or resume new booking requests without hiding tutor profiles.',
  },
  {
    key: 'allowResources',
    title: 'Allow resources',
    description: 'Control access to the shared resources library page.',
  },
];

const navToggleLabels: Array<{
  key: AdminToggleKey;
  title: string;
  description: string;
}> = [
  {
    key: 'showBrowseTutorsNav',
    title: 'Show Find Tutors in nav',
    description: 'Display or hide the Find Tutors link in the navigation bar.',
  },
  {
    key: 'showAboutNav',
    title: 'Show About in nav',
    description: 'Display or hide the About link on the public landing navigation.',
  },
  {
    key: 'showHowItWorksNav',
    title: 'Show How It Works in nav',
    description: 'Display or hide the How It Works link on the public landing navigation.',
  },
  {
    key: 'showContactNav',
    title: 'Show Contact in nav',
    description: 'Display or hide the Contact link on the public landing navigation.',
  },
  {
    key: 'showResourcesNav',
    title: 'Show Resources in nav',
    description: 'Display or hide the Resources link in navigation when resources are enabled.',
  },
];

export default function AdminPage() {
  const {
    currentUser,
    isAdmin,
    isLoading,
    users,
    tutors,
    bookings,
    reviews,
    platformUpdates,
    createPlatformUpdate,
    getUserById,
    platformSettings,
    updatePlatformSettings,
    sendPasswordResetLink,
  } = useApp();
  const router = useRouter();

  const [draftSettings, setDraftSettings] = useState<PlatformSettings>(platformSettings);
  const [isPlatformControlsOpen, setIsPlatformControlsOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [tutorSearch, setTutorSearch] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateCategory, setUpdateCategory] = useState<PlatformUpdate['category']>('announcement');
  const [updateAudience, setUpdateAudience] = useState<PlatformUpdate['audience']>('all');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsMessageType, setSettingsMessageType] = useState<'success' | 'error'>('success');
  const [resetMessage, setResetMessage] = useState('');
  const [resetMessageType, setResetMessageType] = useState<'success' | 'error'>('success');
  const [updatePostMessage, setUpdatePostMessage] = useState('');
  const [updatePostMessageType, setUpdatePostMessageType] = useState<'success' | 'error'>('success');
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/auth/login');
    }
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    setDraftSettings(platformSettings);
  }, [platformSettings]);

  const students = useMemo(() => users.filter((user) => user.role === 'student'), [users]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) => {
      return student.name.toLowerCase().includes(query) || student.email.toLowerCase().includes(query);
    });
  }, [studentSearch, students]);

  const filteredTutors = useMemo(() => {
    const query = tutorSearch.trim().toLowerCase();
    if (!query) return tutors;

    return tutors.filter((tutor) => {
      return (
        tutor.user.name.toLowerCase().includes(query) ||
        tutor.user.email.toLowerCase().includes(query) ||
        tutor.courses.some((course) => {
          const code = course.code.toLowerCase();
          const name = course.name.toLowerCase();
          return code.includes(query) || name.includes(query);
        })
      );
    });
  }, [tutorSearch, tutors]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((firstBooking, secondBooking) => secondBooking.createdAt.getTime() - firstBooking.createdAt.getTime())
      .slice(0, 6);
  }, [bookings]);

  const studentBookingCounts = useMemo(() => {
    return bookings.reduce<Record<string, number>>((counts, booking) => {
      counts[booking.studentId] = (counts[booking.studentId] || 0) + 1;
      return counts;
    }, {});
  }, [bookings]);

  const statCards = [
    {
      label: 'Total Users',
      value: users.length,
      icon: <Users className="h-5 w-5 text-primary" />,
      description: 'Everyone currently registered on the platform.',
    },
    {
      label: 'Students',
      value: students.length,
      icon: <Users className="h-5 w-5 text-primary" />,
      description: 'Learner accounts currently on the platform.',
    },
    {
      label: 'Tutors',
      value: tutors.length,
      icon: <Shield className="h-5 w-5 text-secondary" />,
      description: 'Tutor profiles available in the system.',
    },
    {
      label: 'Bookings',
      value: bookings.length,
      icon: <CalendarClock className="h-5 w-5 text-accent" />,
      description: 'Pending, confirmed, cancelled, and completed sessions.',
    },
    {
      label: 'Reviews',
      value: reviews.length,
      icon: <Star className="h-5 w-5 text-orange-500" />,
      description: 'Ratings and written feedback from learners.',
    },
  ];

  if (isLoading || !currentUser) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4">
            <p className="text-muted-foreground">Loading admin page...</p>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
          <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
            <Card className="w-full border-border/60 bg-card/90">
              <CardHeader>
                <CardTitle>Admin access required</CardTitle>
                <CardDescription>
                  This page is reserved for the configured admin email only.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set `NEXT_PUBLIC_ADMIN_EMAIL` to your chosen admin email, sign in with that same address, and then revisit `/addmean`.
                </p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href={currentUser.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'}>
                    Back to Dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const handleToggleChange = (key: AdminToggleKey, checked: boolean) => {
    setDraftSettings((currentSettings) => ({
      ...currentSettings,
      [key]: checked,
    }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage('');

    try {
      await updatePlatformSettings(draftSettings);
      setSettingsMessageType('success');
      setSettingsMessage('Platform settings saved successfully.');
    } catch (error) {
      setSettingsMessageType('error');
      setSettingsMessage(error instanceof Error ? error.message : 'We could not save the platform settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!resetEmail.trim()) {
      setResetMessageType('error');
      setResetMessage('Enter a student email address first.');
      return;
    }

    setSendingReset(true);
    setResetMessage('');

    try {
      await sendPasswordResetLink(resetEmail.trim());
      setResetMessageType('success');
      setResetMessage(`Password reset link sent to ${resetEmail.trim()}.`);
    } catch (error) {
      setResetMessageType('error');
      setResetMessage(error instanceof Error ? error.message : 'We could not send the password reset link.');
    } finally {
      setSendingReset(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!updateTitle.trim() || !updateMessage.trim()) {
      setUpdatePostMessageType('error');
      setUpdatePostMessage('Add both a title and message before posting an update.');
      return;
    }

    setPostingUpdate(true);
    setUpdatePostMessage('');

    try {
      await createPlatformUpdate({
        title: updateTitle,
        message: updateMessage,
        category: updateCategory,
        audience: updateAudience,
      });

      setUpdateTitle('');
      setUpdateMessage('');
      setUpdateCategory('announcement');
      setUpdateAudience('all');
      setUpdatePostMessageType('success');
      setUpdatePostMessage('Platform update posted successfully.');
    } catch (error) {
      setUpdatePostMessageType('error');
      setUpdatePostMessage(error instanceof Error ? error.message : 'We could not post the platform update.');
    } finally {
      setPostingUpdate(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="text-4xl font-bold text-foreground">Platform control center</h1>
            <p className="max-w-3xl text-muted-foreground">
              This route stays hidden unless someone types `/addmean`, and access now only opens for the configured admin email.
            </p>
          </div>

          {!ADMIN_EMAIL && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                `NEXT_PUBLIC_ADMIN_EMAIL` is not set yet. Add it locally and in Netlify so the admin role stays consistent.
              </AlertDescription>
            </Alert>
          )}

          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
            <CardContent className="flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Platform Size</p>
                <p className="text-5xl font-bold text-foreground md:text-6xl">{users.length}</p>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Total registered users across students and tutors.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Students</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{students.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Tutors</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{tutors.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em]">Bookings</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                    <CardDescription className="mt-1">{card.description}</CardDescription>
                  </div>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>Platform Controls</CardTitle>
                      <CardDescription>
                        Pause key features or control which links show in the navigation bar.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPlatformControlsOpen((currentValue) => !currentValue)}
                    >
                      {isPlatformControlsOpen ? 'Hide Controls' : 'Open Controls'}
                      {isPlatformControlsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {isPlatformControlsOpen ? (
                  <CardContent className="space-y-6">
                    {settingsMessage && (
                      <Alert variant={settingsMessageType === 'success' ? 'default' : 'destructive'}>
                        {settingsMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        <AlertDescription>{settingsMessage}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid gap-4">
                      {featureToggleLabels.map((toggle) => (
                        <div
                          key={toggle.key}
                          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{toggle.title}</p>
                            <p className="text-sm text-muted-foreground">{toggle.description}</p>
                          </div>
                          <Switch
                            checked={draftSettings[toggle.key] as boolean}
                            onCheckedChange={(checked) => handleToggleChange(toggle.key, checked)}
                            aria-label={toggle.title}
                            disabled={savingSettings}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-foreground">Navigation visibility</p>
                        <p className="text-sm text-muted-foreground">
                          These switches control what appears in the app navigation bar.
                        </p>
                      </div>
                      <div className="grid gap-4">
                        {navToggleLabels.map((toggle) => (
                          <div
                            key={toggle.key}
                            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{toggle.title}</p>
                              <p className="text-sm text-muted-foreground">{toggle.description}</p>
                            </div>
                            <Switch
                              checked={draftSettings[toggle.key] as boolean}
                              onCheckedChange={(checked) => handleToggleChange(toggle.key, checked)}
                              aria-label={toggle.title}
                              disabled={savingSettings}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Admin email:
                        <Badge variant="secondary" className="ml-2">
                          {platformSettings.adminEmail || ADMIN_EMAIL || 'Not configured'}
                        </Badge>
                      </div>
                      <Button onClick={() => void handleSaveSettings()} className="bg-primary hover:bg-primary/90" disabled={savingSettings}>
                        {savingSettings ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Platform Settings'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                      <p className="font-medium text-foreground">Controls are currently collapsed.</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Open this section when you want to pause features or change what shows in the navigation bar.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    Review learner accounts and pick an email quickly when someone forgets a password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search students by name or email"
                  />

                  {filteredStudents.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No students match your search.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                            <TableCell className="text-muted-foreground">{student.email}</TableCell>
                            <TableCell>{studentBookingCounts[student.id] || 0}</TableCell>
                            <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => setResetEmail(student.email)}>
                                Use Email
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tutors</CardTitle>
                  <CardDescription>
                    Search tutors by name, email, or course they teach.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tutorSearch}
                      onChange={(event) => setTutorSearch(event.target.value)}
                      placeholder="Search tutors by name, email, or course"
                      className="pl-9"
                    />
                  </div>

                  {filteredTutors.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No tutors match your search.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tutor</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Courses</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTutors.map((tutor) => (
                          <TableRow key={tutor.id}>
                            <TableCell className="font-medium text-foreground">{tutor.user.name}</TableCell>
                            <TableCell className="text-muted-foreground">{tutor.user.email}</TableCell>
                            <TableCell className="max-w-[220px]">
                              <div className="flex flex-wrap gap-1">
                                {tutor.courses.length === 0 ? (
                                  <span className="text-sm text-muted-foreground">No courses yet</span>
                                ) : (
                                  tutor.courses.slice(0, 3).map((course) => (
                                    <Badge key={course.id} variant="outline">
                                      {course.code}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell>NGN {tutor.hourlyRate.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={tutor.isAvailable ? 'default' : 'secondary'}>
                                {tutor.isAvailable ? 'Available' : 'Unavailable'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Platform Update</CardTitle>
                  <CardDescription>
                    Share announcements with everyone or target only students or tutors.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {updatePostMessage && (
                    <Alert variant={updatePostMessageType === 'success' ? 'default' : 'destructive'}>
                      {updatePostMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{updatePostMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Input
                    value={updateTitle}
                    onChange={(event) => setUpdateTitle(event.target.value)}
                    placeholder="Update title"
                    disabled={postingUpdate}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={updateCategory}
                      onChange={(event) => setUpdateCategory(event.target.value as PlatformUpdate['category'])}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      disabled={postingUpdate}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="coming-soon">Coming Soon</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="feature">Feature</option>
                    </select>

                    <select
                      value={updateAudience}
                      onChange={(event) => setUpdateAudience(event.target.value as PlatformUpdate['audience'])}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      disabled={postingUpdate}
                    >
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="tutors">Tutors Only</option>
                    </select>
                  </div>

                  <Textarea
                    value={updateMessage}
                    onChange={(event) => setUpdateMessage(event.target.value)}
                    placeholder="Write the update message users should see on their dashboards."
                    rows={5}
                    disabled={postingUpdate}
                  />

                  <Button onClick={() => void handlePostUpdate()} className="w-full bg-primary hover:bg-primary/90" disabled={postingUpdate}>
                    {postingUpdate ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting update...
                      </>
                    ) : (
                      <>
                        <BellRing className="mr-2 h-4 w-4" />
                        Post Update
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Password Reset Helper</CardTitle>
                  <CardDescription>
                    Send a Firebase reset email to a student who forgot their password.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resetMessage && (
                    <Alert variant={resetMessageType === 'success' ? 'default' : 'destructive'}>
                      {resetMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertDescription>{resetMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      <p className="font-medium text-foreground">Forgot password support</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The student receives the reset link in their inbox, which keeps password changes secure and private.
                    </p>
                  </div>

                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="student@example.com"
                    disabled={sendingReset}
                  />

                  <Button
                    onClick={() => void handleSendResetLink()}
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={sendingReset}
                  >
                    {sendingReset ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset link...
                      </>
                    ) : (
                      'Send Password Reset Link'
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>
                    The latest platform notices currently visible to users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {platformUpdates.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">No platform updates posted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {platformUpdates.slice(0, 5).map((update) => (
                        <div key={update.id} className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {update.category.replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {update.audience === 'all' ? 'All users' : update.audience}
                            </Badge>
                          </div>
                          <p className="font-semibold text-foreground">{update.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{update.message}</p>
                          <p className="mt-3 text-xs text-muted-foreground">
                            {new Date(update.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>
                    A quick look at the latest booking activity across the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentBookings.length === 0 ? (
                    <p className="py-6 text-center text-muted-foreground">No bookings yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentBookings.map((booking) => {
                        const student = getUserById(booking.studentId);
                        const tutor = tutors.find((item) => item.id === booking.tutorId);

                        return (
                          <div key={booking.id} className="rounded-xl border border-border bg-muted/30 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">
                                  {student?.name || 'Unknown student'} with {tutor?.user.name || 'Unknown tutor'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(booking.sessionDate).toLocaleString()} - {booking.duration} minutes
                                </p>
                              </div>
                              <Badge variant="secondary" className="capitalize">
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Jump to the main platform areas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start bg-primary hover:bg-primary/90">
                    <Link href="/student/dashboard">
                      <Users className="mr-2 h-4 w-4" />
                      Student Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/tutor/dashboard">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Tutor Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/settings">
                      <Shield className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
