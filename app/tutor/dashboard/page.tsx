'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Calendar, Users, Zap, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const dashboardTabs = ['overview', 'sessions', 'students', 'earnings'] as const;

type DashboardTab = (typeof dashboardTabs)[number];

const MODE_SWITCH_NOTICE_KEY = 'campustutor-mode-switch-notice';

const isDashboardTab = (value: string | null): value is DashboardTab => {
  return value !== null && dashboardTabs.includes(value as DashboardTab);
};

export default function TutorDashboard() {
  const {
    currentUser,
    getBookings,
    getCourseLabel,
    getReviews,
    getTutorByUserId,
    getUserById,
    confirmBooking,
    cancelBooking,
  } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const tutorProfile = currentUser ? getTutorByUserId(currentUser.id) : undefined;

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(isDashboardTab(tab) ? tab : 'overview');
  }, [searchParams]);

  useEffect(() => {
    const modeNotice = sessionStorage.getItem(MODE_SWITCH_NOTICE_KEY);
    if (modeNotice !== 'Tutor') return;

    toast.success(`You're now in ${modeNotice} mode.`);
    sessionStorage.removeItem(MODE_SWITCH_NOTICE_KEY);
  }, []);

  const bookings = currentUser ? getBookings(currentUser.id, 'tutor') : [];
  const studentReviews = tutorProfile ? getReviews(tutorProfile.id) : [];
  const upcomingSessions = bookings.filter((booking) => booking.status === 'confirmed');
  const completedSessions = bookings.filter((booking) => booking.status === 'completed');
  const pendingRequests = bookings.filter((booking) => booking.status === 'pending');

  const totalEarnings = completedSessions.reduce((sum, booking) => {
    return sum + (tutorProfile ? (booking.duration / 60) * tutorProfile.hourlyRate : 0);
  }, 0);

  const stats = [
    {
      label: 'Total Students',
      value: new Set(bookings.map((booking) => booking.studentId)).size,
      icon: <Users className="w-6 h-6 text-primary" />,
    },
    {
      label: 'Hours Taught',
      value: Math.round(completedSessions.reduce((sum, booking) => sum + booking.duration, 0) / 60),
      icon: <Clock className="w-6 h-6 text-secondary" />,
    },
    {
      label: 'Rating',
      value: tutorProfile?.rating || 0,
      icon: <Star className="w-6 h-6 text-orange-500" />,
      subtitle: `(${studentReviews.length} reviews)`,
    },
    {
      label: 'Earnings',
      value: `NGN ${totalEarnings.toLocaleString()}`,
      icon: <TrendingUp className="w-6 h-6 text-accent" />,
    },
  ];

  const getStudentName = (studentId: string) => {
    const user = getUserById(studentId);
    return user?.name || 'Unknown';
  };

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      await confirmBooking(bookingId);
      toast.success('Booking confirmed.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to confirm this booking.');
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      toast.success('Booking declined.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to decline this booking.');
    }
  };

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    router.replace(tab === 'overview' ? '/tutor/dashboard' : `/tutor/dashboard?tab=${tab}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {currentUser?.name}!</h1>
        <p className="text-muted-foreground">Manage your tutoring sessions and student interactions</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {dashboardTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              activeTab === tab ? 'bg-primary text-white' : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Booking Requests ({pendingRequests.length})
              </CardTitle>
              <CardDescription>Approve or decline requests from students</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{getStudentName(booking.studentId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getCourseLabel(booking.tutorId, booking.subjectId)} -{' '}
                          {new Date(booking.sessionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/booking/${booking.id}`}>View</Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleConfirmBooking(booking.id)}>
                          Confirm
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleDeclineBooking(booking.id)}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>{upcomingSessions.length} sessions scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No upcoming sessions</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{getStudentName(booking.studentId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getCourseLabel(booking.tutorId, booking.subjectId)} -{' '}
                          {new Date(booking.sessionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/booking/${booking.id}`}>View Booking</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Student Reviews
              </CardTitle>
              <CardDescription>{studentReviews.length} reviews received</CardDescription>
            </CardHeader>
            <CardContent>
              {studentReviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {studentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${index < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-sm">{review.rating}/5</span>
                      </div>
                      <p className="text-foreground text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardHeader>
            <CardTitle>Session History</CardTitle>
            <CardDescription>{completedSessions.length} completed sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {completedSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No completed sessions yet</p>
            ) : (
              <div className="space-y-3">
                {completedSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <p className="font-semibold text-foreground">{getStudentName(session.studentId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCourseLabel(session.tutorId, session.subjectId)} -{' '}
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'students' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Students</CardTitle>
            <CardDescription>{new Set(bookings.map((booking) => booking.studentId)).size} unique students</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No student sessions yet</p>
            ) : (
              <div className="space-y-3">
                {Array.from(new Set(bookings.map((booking) => booking.studentId))).map((studentId) => {
                  const studentBookings = bookings.filter((booking) => booking.studentId === studentId);
                  return (
                    <div key={studentId} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                      <div>
                        <p className="font-semibold text-foreground">{getStudentName(studentId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {studentBookings.length} session{studentBookings.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings Summary</CardTitle>
              <CardDescription>Track your tutoring income</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg p-6">
                <p className="text-muted-foreground text-sm mb-1">Total Earnings</p>
                <p className="text-4xl font-bold text-foreground">NGN {totalEarnings.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  From {completedSessions.length} completed sessions
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">Hourly Rate</p>
                  <p className="text-2xl font-bold text-foreground">
                    NGN {(tutorProfile?.hourlyRate ?? 0).toLocaleString()}/hr
                  </p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm">Hours Taught</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round(completedSessions.reduce((sum, booking) => sum + booking.duration, 0) / 60)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
