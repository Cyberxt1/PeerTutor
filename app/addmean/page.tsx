'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BellRing,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  Shield,
  Star,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import Header from '@/components/layout/header';
import { useApp } from '@/lib/context';
import { ADMIN_EMAIL, DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from '@/lib/platform';
import {
  fetchAdminDashboard,
  postAdminPlatformUpdate,
  saveAdminPlatformSettings,
  sendAdminPasswordReset,
  sendAdminUserNotification,
  updateAdminUserStatus,
  type AdminDashboardBooking,
  type AdminDashboardPlatformUpdate,
  type AdminDashboardReview,
  type AdminDashboardTutorProfile,
  type AdminDashboardUser,
} from '@/lib/admin-client';
import {
  buildTutorRecords,
  type StoredTutorProfile,
} from '@/lib/firebase/service';
import type { Booking, PlatformUpdate, Review, TutorRecord, User } from '@/lib/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type AdminToggleKey = Exclude<keyof PlatformSettings, 'adminEmail'>;

const featureToggleLabels: Array<{ key: AdminToggleKey; title: string; description: string }> = [
  { key: 'allowNewSignups', title: 'Allow new signups', description: 'Turn account creation on or off.' },
  { key: 'allowTutorBrowsing', title: 'Allow tutor browsing', description: 'Control tutor search and profile browsing.' },
  { key: 'allowBookings', title: 'Allow bookings', description: 'Pause or resume new booking requests.' },
  { key: 'allowResources', title: 'Allow resources', description: 'Control access to the resources page.' },
];

const navToggleLabels: Array<{ key: AdminToggleKey; title: string; description: string }> = [
  { key: 'showBrowseTutorsNav', title: 'Show Find Tutors', description: 'Display or hide Find Tutors in nav.' },
  { key: 'showAboutNav', title: 'Show About', description: 'Display or hide About in nav.' },
  { key: 'showHowItWorksNav', title: 'Show How It Works', description: 'Display or hide How It Works in nav.' },
  { key: 'showContactNav', title: 'Show Contact', description: 'Display or hide Contact in nav.' },
  { key: 'showResourcesNav', title: 'Show Resources', description: 'Display or hide Resources in nav.' },
];

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function mapAdminUser(user: AdminDashboardUser): User {
  return {
    ...user,
    createdAt: parseDate(user.createdAt),
  };
}

function mapAdminTutorProfile(profile: AdminDashboardTutorProfile): StoredTutorProfile {
  return {
    ...profile,
    createdAt: parseDate(profile.createdAt),
  };
}

function mapAdminBooking(booking: AdminDashboardBooking): Booking {
  return {
    ...booking,
    sessionDate: parseDate(booking.sessionDate),
    createdAt: parseDate(booking.createdAt),
  };
}

function mapAdminReview(review: AdminDashboardReview): Review {
  return {
    ...review,
    createdAt: parseDate(review.createdAt),
  };
}

function mapAdminPlatformUpdate(update: AdminDashboardPlatformUpdate): PlatformUpdate {
  return {
    ...update,
    createdAt: parseDate(update.createdAt),
  };
}

export default function AdminPage() {
  const {
    currentUser,
    isAdmin,
    isLoading,
  } = useApp();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [tutorProfiles, setTutorProfiles] = useState<StoredTutorProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userNotificationTitle, setUserNotificationTitle] = useState('');
  const [userNotificationMessage, setUserNotificationMessage] = useState('');
  const [userActionMessage, setUserActionMessage] = useState('');
  const [userActionMessageType, setUserActionMessageType] = useState<'success' | 'error'>('success');
  const [savingSettings, setSavingSettings] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [managingUser, setManagingUser] = useState(false);

  useEffect(() => {
    if (!isLoading && !currentUser) router.replace('/auth/login');
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    setDraftSettings(platformSettings);
  }, [platformSettings]);

  useEffect(() => {
    if (!currentUser || !isAdmin) return;

    let isMounted = true;

    const loadDashboard = async () => {
      setLoadingDashboard(true);
      setDashboardError('');

      try {
        const data = await fetchAdminDashboard();
        if (!isMounted) return;

        setUsers(data.users.map(mapAdminUser));
        setTutorProfiles(data.tutorProfiles.map(mapAdminTutorProfile));
        setBookings(data.bookings.map(mapAdminBooking));
        setReviews(data.reviews.map(mapAdminReview));
        setPlatformUpdates(data.platformUpdates.map(mapAdminPlatformUpdate));
        setPlatformSettings(data.platformSettings);
      } catch (error) {
        if (!isMounted) return;
        setDashboardError(error instanceof Error ? error.message : 'We could not load the admin dashboard.');
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (!selectedUser) return;
    setUserNotificationTitle('');
    setUserNotificationMessage('');
    setUserActionMessage('');
  }, [selectedUser]);

  const students = useMemo(() => users.filter((user) => user.role === 'student'), [users]);
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;
    return students.filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query));
  }, [studentSearch, students]);

  const tutors = useMemo(
    () => buildTutorRecords(tutorProfiles, users, reviews),
    [reviews, tutorProfiles, users]
  );

  const filteredTutors = useMemo(() => {
    const query = tutorSearch.trim().toLowerCase();
    if (!query) return tutors;
    return tutors.filter((tutor) =>
      tutor.user.name.toLowerCase().includes(query) ||
      tutor.user.email.toLowerCase().includes(query) ||
      tutor.courses.some((course) => course.code.toLowerCase().includes(query) || course.name.toLowerCase().includes(query))
    );
  }, [tutorSearch, tutors]);

  const recentBookings = useMemo(
    () => [...bookings].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6),
    [bookings]
  );
  const getUserById = (userId: string) => users.find((user) => user.id === userId);
  const userBookingCounts = useMemo(
    () =>
      bookings.reduce<Record<string, number>>((counts, booking) => {
        counts[booking.studentId] = (counts[booking.studentId] || 0) + 1;
        counts[booking.tutorUserId] = (counts[booking.tutorUserId] || 0) + 1;
        return counts;
      }, {}),
    [bookings]
  );
  const selectedTutorRecord = useMemo<TutorRecord | undefined>(
    () => (selectedUser ? tutors.find((tutor) => tutor.userId === selectedUser.id) : undefined),
    [selectedUser, tutors]
  );
  const selectedUserBookings = useMemo(
    () =>
      selectedUser
        ? bookings.filter((booking) => booking.studentId === selectedUser.id || booking.tutorUserId === selectedUser.id)
        : [],
    [bookings, selectedUser]
  );

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
                <CardDescription>This page is reserved for the configured admin email only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set `NEXT_PUBLIC_ADMIN_EMAIL` to your chosen admin email, sign in with that same address, and then revisit `/addmean`.
                </p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/settings">Back to Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const statCards = [
    { label: 'Total Users', value: users.length, icon: <Users className="h-5 w-5 text-primary" />, description: 'Everyone registered.' },
    { label: 'Students', value: students.length, icon: <Users className="h-5 w-5 text-primary" />, description: 'Learner accounts.' },
    { label: 'Tutors', value: tutors.length, icon: <Shield className="h-5 w-5 text-secondary" />, description: 'Tutor profiles.' },
    { label: 'Bookings', value: bookings.length, icon: <CalendarClock className="h-5 w-5 text-accent" />, description: 'All sessions.' },
    { label: 'Reviews', value: reviews.length, icon: <Star className="h-5 w-5 text-orange-500" />, description: 'Written feedback.' },
  ];

  const handleToggleChange = (key: AdminToggleKey, checked: boolean) => {
    setDraftSettings((current) => ({ ...current, [key]: checked }));
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMessage('');
    try {
      const nextSettings = await saveAdminPlatformSettings(draftSettings);
      setPlatformSettings(nextSettings);
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
      await sendAdminPasswordReset(resetEmail.trim());
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
      const createdUpdate = await postAdminPlatformUpdate({
        title: updateTitle,
        message: updateMessage,
        category: updateCategory,
        audience: updateAudience,
      });
      setPlatformUpdates((current) => [mapAdminPlatformUpdate(createdUpdate), ...current]);
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

  const handleUserStatusUpdate = async (status: 'active' | 'suspended' | 'deleted') => {
    if (!selectedUser) return;
    setManagingUser(true);
    setUserActionMessage('');
    try {
      const updatedUser = mapAdminUser(await updateAdminUserStatus(selectedUser.id, status));
      setUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      setSelectedUser(updatedUser);
      setUserActionMessageType('success');
      setUserActionMessage(status === 'active' ? 'User reactivated.' : status === 'suspended' ? 'User suspended.' : 'User removed from the platform.');
    } catch (error) {
      setUserActionMessageType('error');
      setUserActionMessage(error instanceof Error ? error.message : 'We could not update this user.');
    } finally {
      setManagingUser(false);
    }
  };

  const handleSendDirectNotification = async () => {
    if (!selectedUser) return;
    if (!userNotificationTitle.trim() || !userNotificationMessage.trim()) {
      setUserActionMessageType('error');
      setUserActionMessage('Add both a notification title and message before sending.');
      return;
    }
    setManagingUser(true);
    setUserActionMessage('');
    try {
      await sendAdminUserNotification(selectedUser.id, userNotificationTitle, userNotificationMessage);
      setUserNotificationTitle('');
      setUserNotificationMessage('');
      setUserActionMessageType('success');
      setUserActionMessage('Direct notification sent successfully.');
    } catch (error) {
      setUserActionMessageType('error');
      setUserActionMessage(error instanceof Error ? error.message : 'We could not send this notification.');
    } finally {
      setManagingUser(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen overflow-x-hidden bg-gradient-to-b from-background via-background to-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Admin</p>
            <h1 className="text-4xl font-bold text-foreground">Platform control center</h1>
            <p className="max-w-3xl text-muted-foreground">This route stays hidden unless someone types `/addmean`, and access only opens for the configured admin email.</p>
          </div>

          {!ADMIN_EMAIL && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>`NEXT_PUBLIC_ADMIN_EMAIL` is not set yet. Add it locally and in Netlify.</AlertDescription>
            </Alert>
          )}

          {dashboardError && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dashboardError}</AlertDescription>
            </Alert>
          )}

          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
            <CardContent className="flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Platform Size</p>
                <p className="text-5xl font-bold text-foreground md:text-6xl">
                  {loadingDashboard ? '...' : users.length}
                </p>
                <p className="max-w-xl text-sm text-muted-foreground">Total registered users across students and tutors.</p>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.18em]">Students</p><p className="mt-2 text-2xl font-semibold text-foreground">{students.length}</p></div>
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.18em]">Tutors</p><p className="mt-2 text-2xl font-semibold text-foreground">{tutors.length}</p></div>
                <div className="rounded-xl border border-border bg-background/80 px-4 py-3"><p className="text-xs uppercase tracking-[0.18em]">Bookings</p><p className="mt-2 text-2xl font-semibold text-foreground">{bookings.length}</p></div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div><CardTitle className="text-sm font-medium">{card.label}</CardTitle><CardDescription className="mt-1">{card.description}</CardDescription></div>
                  {card.icon}
                </CardHeader>
                <CardContent><p className="text-3xl font-bold text-foreground">{card.value}</p></CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <CardTitle>Platform Controls</CardTitle>
                      <CardDescription>Pause key features or control which links show in the navigation bar.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsPlatformControlsOpen((v) => !v)} className="w-full sm:w-auto">
                      {isPlatformControlsOpen ? 'Hide Controls' : 'Open Controls'}
                      {isPlatformControlsOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {isPlatformControlsOpen ? (
                  <CardContent className="space-y-6">
                    {settingsMessage && <Alert variant={settingsMessageType === 'success' ? 'default' : 'destructive'}>{settingsMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<AlertDescription>{settingsMessage}</AlertDescription></Alert>}
                    <div className="grid gap-4">
                      {featureToggleLabels.map((toggle) => (
                        <div key={toggle.key} className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 space-y-1"><p className="font-medium text-foreground">{toggle.title}</p><p className="text-sm text-muted-foreground">{toggle.description}</p></div>
                          <Switch checked={draftSettings[toggle.key] as boolean} onCheckedChange={(checked) => handleToggleChange(toggle.key, checked)} disabled={savingSettings} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <div><p className="font-medium text-foreground">Navigation visibility</p><p className="text-sm text-muted-foreground">These switches control what appears in the app navigation bar.</p></div>
                      <div className="grid gap-4">
                        {navToggleLabels.map((toggle) => (
                          <div key={toggle.key} className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 space-y-1"><p className="font-medium text-foreground">{toggle.title}</p><p className="text-sm text-muted-foreground">{toggle.description}</p></div>
                            <Switch checked={draftSettings[toggle.key] as boolean} onCheckedChange={(checked) => handleToggleChange(toggle.key, checked)} disabled={savingSettings} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>Admin email:</span>
                        <Badge variant="secondary" className="max-w-full break-all text-left whitespace-normal">
                          {platformSettings.adminEmail || ADMIN_EMAIL || 'Not configured'}
                        </Badge>
                      </div>
                      <Button onClick={() => void handleSaveSettings()} className="w-full bg-primary hover:bg-primary/90 sm:w-auto" disabled={savingSettings || loadingDashboard}>{savingSettings ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Platform Settings'}</Button>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent><div className="rounded-xl border border-dashed border-border bg-muted/20 p-5"><p className="font-medium text-foreground">Controls are currently collapsed.</p><p className="mt-2 text-sm text-muted-foreground">Open this section when you want to pause features or change what shows in the navigation bar.</p></div></CardContent>
                )}
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>Click a student to view details, suspend, delete, or send a direct notification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search students by name or email" disabled={loadingDashboard} />
                  <div className="scrollbar-hidden max-h-[24rem] overflow-y-auto rounded-xl border border-border">
                    {filteredStudents.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No students match your search.</p> : (
                      <>
                        <div className="space-y-3 p-3 md:hidden">
                          {filteredStudents.map((student) => (
                            <div key={student.id} className="rounded-xl border border-border bg-muted/20 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="font-medium text-foreground">{student.name}</p>
                                  <p className="break-all text-sm text-muted-foreground">{student.email}</p>
                                </div>
                                <Badge variant={student.accountStatus === 'active' ? 'default' : 'secondary'}>{student.accountStatus || 'active'}</Badge>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">Bookings: {userBookingCounts[student.id] || 0}</p>
                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(student)}>View</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                          <Table className="min-w-[640px]">
                            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Bookings</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {filteredStudents.map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{student.email}</TableCell>
                                  <TableCell><Badge variant={student.accountStatus === 'active' ? 'default' : 'secondary'}>{student.accountStatus || 'active'}</Badge></TableCell>
                                  <TableCell>{userBookingCounts[student.id] || 0}</TableCell>
                                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelectedUser(student)}>View</Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tutors</CardTitle>
                  <CardDescription>Click a tutor to view details, suspend, delete, or send a direct notification.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={tutorSearch} onChange={(e) => setTutorSearch(e.target.value)} placeholder="Search tutors by name, email, or course" className="pl-9" disabled={loadingDashboard} /></div>
                  <div className="scrollbar-hidden max-h-[24rem] overflow-y-auto rounded-xl border border-border">
                    {filteredTutors.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No tutors match your search.</p> : (
                      <>
                        <div className="space-y-3 p-3 md:hidden">
                          {filteredTutors.map((tutor) => (
                            <div key={tutor.id} className="rounded-xl border border-border bg-muted/20 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="font-medium text-foreground">{tutor.user.name}</p>
                                  <p className="break-all text-sm text-muted-foreground">{tutor.user.email}</p>
                                </div>
                                <Badge variant={tutor.user.accountStatus === 'active' ? 'default' : 'secondary'}>{tutor.user.accountStatus || 'active'}</Badge>
                              </div>
                              <p className="mt-3 text-sm text-muted-foreground">Rate: NGN {tutor.hourlyRate.toLocaleString()}</p>
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {tutor.courses.length > 0 ? tutor.courses.map((course) => course.code).join(', ') : 'No courses listed'}
                                </p>
                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(tutor.user)}>View</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="hidden overflow-x-auto md:block">
                          <Table className="min-w-[640px]">
                            <TableHeader><TableRow><TableHead>Tutor</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                              {filteredTutors.map((tutor) => (
                                <TableRow key={tutor.id}>
                                  <TableCell className="font-medium text-foreground">{tutor.user.name}</TableCell>
                                  <TableCell className="text-muted-foreground">{tutor.user.email}</TableCell>
                                  <TableCell><Badge variant={tutor.user.accountStatus === 'active' ? 'default' : 'secondary'}>{tutor.user.accountStatus || 'active'}</Badge></TableCell>
                                  <TableCell>NGN {tutor.hourlyRate.toLocaleString()}</TableCell>
                                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => setSelectedUser(tutor.user)}>View</Button></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader><CardTitle>Post Platform Update</CardTitle><CardDescription>Share announcements with everyone or target students or tutors.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {updatePostMessage && <Alert variant={updatePostMessageType === 'success' ? 'default' : 'destructive'}>{updatePostMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<AlertDescription>{updatePostMessage}</AlertDescription></Alert>}
                  <Input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} placeholder="Update title" disabled={postingUpdate || loadingDashboard} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select value={updateCategory} onChange={(e) => setUpdateCategory(e.target.value as PlatformUpdate['category'])} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" disabled={postingUpdate || loadingDashboard}>
                      <option value="announcement">Announcement</option><option value="coming-soon">Coming Soon</option><option value="maintenance">Maintenance</option><option value="feature">Feature</option>
                    </select>
                    <select value={updateAudience} onChange={(e) => setUpdateAudience(e.target.value as PlatformUpdate['audience'])} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" disabled={postingUpdate || loadingDashboard}>
                      <option value="all">All Users</option><option value="students">Students Only</option><option value="tutors">Tutors Only</option>
                    </select>
                  </div>
                  <Textarea value={updateMessage} onChange={(e) => setUpdateMessage(e.target.value)} placeholder="Write the update message users should see on their dashboards." rows={5} disabled={postingUpdate || loadingDashboard} />
                  <Button onClick={() => void handlePostUpdate()} className="w-full bg-primary hover:bg-primary/90" disabled={postingUpdate || loadingDashboard}>{postingUpdate ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting update...</> : <><BellRing className="mr-2 h-4 w-4" />Post Update</>}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Password Reset Helper</CardTitle><CardDescription>Send a Firebase reset email to a student who forgot their password.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {resetMessage && <Alert variant={resetMessageType === 'success' ? 'default' : 'destructive'}>{resetMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<AlertDescription>{resetMessage}</AlertDescription></Alert>}
                  <div className="rounded-xl border border-border bg-muted/30 p-4"><div className="mb-3 flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><p className="font-medium text-foreground">Forgot password support</p></div><p className="text-sm text-muted-foreground">The student receives the reset link in their inbox.</p></div>
                  <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="student@example.com" disabled={sendingReset || loadingDashboard} />
                  <Button onClick={() => void handleSendResetLink()} className="w-full bg-primary hover:bg-primary/90" disabled={sendingReset || loadingDashboard}>{sendingReset ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending reset link...</> : 'Send Password Reset Link'}</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Recent Updates</CardTitle><CardDescription>The latest platform notices currently visible to users.</CardDescription></CardHeader>
                <CardContent>
                  {platformUpdates.length === 0 ? <p className="py-6 text-center text-muted-foreground">No platform updates posted yet.</p> : (
                    <div className="space-y-3">
                      {platformUpdates.slice(0, 5).map((update) => (
                        <div key={update.id} className="rounded-xl border border-border bg-muted/30 p-4">
                          <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="secondary" className="capitalize">{update.category.replace('-', ' ')}</Badge><Badge variant="outline" className="capitalize">{update.audience === 'all' ? 'All users' : update.audience}</Badge></div>
                          <p className="font-semibold text-foreground">{update.title}</p>
                          <p className="mt-2 text-sm text-muted-foreground">{update.message}</p>
                          <p className="mt-3 text-xs text-muted-foreground">{new Date(update.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Recent Bookings</CardTitle><CardDescription>A quick look at the latest booking activity across the platform.</CardDescription></CardHeader>
                <CardContent>
                  {recentBookings.length === 0 ? <p className="py-6 text-center text-muted-foreground">No bookings yet.</p> : (
                    <div className="space-y-3">
                      {recentBookings.map((booking) => {
                        const student = getUserById(booking.studentId);
                        const tutor = tutors.find((item) => item.id === booking.tutorId);
                        return (
                          <div key={booking.id} className="rounded-xl border border-border bg-muted/30 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1"><p className="break-words font-semibold text-foreground">{student?.name || 'Unknown student'} with {tutor?.user.name || 'Unknown tutor'}</p><p className="text-sm text-muted-foreground">{new Date(booking.sessionDate).toLocaleString()} - {booking.duration} minutes</p></div>
                              <Badge variant="secondary" className="capitalize">{booking.status}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[88vh] overflow-hidden p-0 sm:max-w-2xl">
          {selectedUser && (
            <div className="flex max-h-[88vh] flex-col">
              <div className="border-b border-border px-4 py-4 sm:px-6">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 pr-8"><UserCog className="h-5 w-5 text-primary" />{selectedUser.name}</DialogTitle>
                  <DialogDescription>View account details, manage access, or send a direct notification.</DialogDescription>
                </DialogHeader>
              </div>

              <div className="scrollbar-hidden flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                <div className="space-y-4">
                  {userActionMessage && <Alert variant={userActionMessageType === 'success' ? 'default' : 'destructive'}>{userActionMessageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}<AlertDescription>{userActionMessage}</AlertDescription></Alert>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Role</p><p className="mt-2 font-semibold text-foreground capitalize">{selectedUser.role}</p></div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p><p className="mt-2 font-semibold text-foreground capitalize">{selectedUser.accountStatus || 'active'}</p></div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</p><p className="mt-2 break-all text-sm font-medium text-foreground">{selectedUser.email}</p></div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phone</p><p className="mt-2 text-sm font-medium text-foreground">{selectedUser.phone || 'Not added yet'}</p></div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Joined</p><p className="mt-2 text-sm font-medium text-foreground">{new Date(selectedUser.createdAt).toLocaleString()}</p></div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bookings</p><p className="mt-2 text-sm font-medium text-foreground">{selectedUserBookings.length}</p></div>
                  </div>
                  {selectedTutorRecord && <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="font-medium text-foreground">Tutor details</p><p className="mt-2 text-sm text-muted-foreground">Hourly rate: NGN {selectedTutorRecord.hourlyRate.toLocaleString()} • Courses: {selectedTutorRecord.courses.length > 0 ? selectedTutorRecord.courses.map((course) => course.code).join(', ') : 'No courses listed'}</p></div>}
                  {selectedUser.bio && <div className="rounded-xl border border-border bg-muted/20 p-4"><p className="font-medium text-foreground">Bio</p><p className="mt-2 text-sm text-muted-foreground">{selectedUser.bio}</p></div>}
                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                    <p className="font-medium text-foreground">Send direct notification</p>
                    <Input value={userNotificationTitle} onChange={(e) => setUserNotificationTitle(e.target.value)} placeholder="Notification title" disabled={managingUser} />
                    <Textarea value={userNotificationMessage} onChange={(e) => setUserNotificationMessage(e.target.value)} placeholder="Write a message this user will see on their dashboard." rows={4} disabled={managingUser} />
                    <Button onClick={() => void handleSendDirectNotification()} className="w-full bg-primary hover:bg-primary/90" disabled={managingUser}>{managingUser ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Working...</> : 'Send Notification'}</Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-4 py-4 sm:px-6">
                <DialogFooter className="gap-3 sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={() => void handleUserStatusUpdate(selectedUser.accountStatus === 'suspended' ? 'active' : 'suspended')} disabled={managingUser || selectedUser.accountStatus === 'deleted'}>{selectedUser.accountStatus === 'suspended' ? 'Reactivate User' : 'Suspend User'}</Button>
                    <Button variant="destructive" onClick={() => void handleUserStatusUpdate('deleted')} disabled={managingUser || selectedUser.accountStatus === 'deleted'}><Trash2 className="mr-2 h-4 w-4" />Delete From Platform</Button>
                  </div>
                  <p className="text-xs text-muted-foreground sm:max-w-[16rem]">Delete removes access from this platform. It does not erase the Firebase auth record.</p>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
