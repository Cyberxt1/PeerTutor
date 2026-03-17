'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Calendar, Book, CheckCircle, Clock } from 'lucide-react';

const MODE_SWITCH_NOTICE_KEY = 'campustutor-mode-switch-notice';

export default function StudentDashboard() {
  const { currentUser, reviews, getBookings, getCourseLabel, getTutorById } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'sessions' | 'reviews'>('overview');

  useEffect(() => {
    const modeNotice = sessionStorage.getItem(MODE_SWITCH_NOTICE_KEY);
    if (modeNotice !== 'Learner') return;

    toast.success(`You're now in ${modeNotice} mode.`);
    sessionStorage.removeItem(MODE_SWITCH_NOTICE_KEY);
  }, []);

  const bookings = currentUser ? getBookings(currentUser.id, 'student') : [];
  const writtenReviews = useMemo(() => {
    return reviews.filter((review) => review.studentId === currentUser?.id);
  }, [currentUser?.id, reviews]);

  const reviewedBookingIds = new Set(writtenReviews.map((review) => review.bookingId));
  const upcomingSessions = bookings.filter((booking) => booking.status === 'confirmed');
  const completedSessions = bookings.filter((booking) => booking.status === 'completed');

  const stats = [
    { label: 'Total Sessions', value: bookings.length, icon: <Book className="w-6 h-6 text-primary" /> },
    {
      label: 'Hours Learned',
      value: Math.round(completedSessions.reduce((sum, booking) => sum + booking.duration, 0) / 60),
      icon: <Clock className="w-6 h-6 text-secondary" />,
    },
    { label: 'Completed', value: completedSessions.length, icon: <CheckCircle className="w-6 h-6 text-accent" /> },
    { label: 'Upcoming', value: upcomingSessions.length, icon: <Calendar className="w-6 h-6 text-orange-500" /> },
  ];

  const getTutorName = (tutorId: string) => {
    const tutor = getTutorById(tutorId);
    return tutor?.user.name || 'Unknown';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome back, {currentUser?.name}!</h1>
        <p className="text-muted-foreground">Manage your tutoring sessions and track your progress</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(['overview', 'bookings', 'sessions', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>{upcomingSessions.length} sessions scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No upcoming sessions</p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/search-tutors">Find a Tutor</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{getTutorName(booking.tutorId)}</p>
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
                Rate Your Experience
              </CardTitle>
              <CardDescription>Help other students find great tutors</CardDescription>
            </CardHeader>
            <CardContent>
              {completedSessions.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  Complete your first session to leave a review
                </p>
              ) : (
                <div className="space-y-3">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{getTutorName(session.tutorId)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getCourseLabel(session.tutorId, session.subjectId)}
                        </p>
                      </div>
                      {reviewedBookingIds.has(session.id) ? (
                        <Button variant="outline" size="sm" disabled>
                          Review Submitted
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/review/new?bookingId=${session.id}&tutorId=${session.tutorId}`}>
                            Write Review
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bookings' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bookings</CardTitle>
            <CardDescription>{bookings.length} total bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No bookings yet</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/search-tutors">Book a Tutor</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <p className="font-semibold text-foreground">{getTutorName(booking.tutorId)}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCourseLabel(booking.tutorId, booking.subjectId)} -{' '}
                        {new Date(booking.sessionDate).toLocaleDateString()}
                      </p>
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs rounded-full font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-accent/20 text-accent'
                            : booking.status === 'pending'
                              ? 'bg-orange-500/20 text-orange-700'
                              : booking.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-700'
                                : 'bg-green-500/20 text-green-700'
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/booking/${booking.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                  <div key={session.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div>
                      <p className="font-semibold text-foreground">{getTutorName(session.tutorId)}</p>
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

      {activeTab === 'reviews' && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews You&apos;ve Written</CardTitle>
          </CardHeader>
          <CardContent>
            {writtenReviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No reviews yet. Complete a session and write a review to help the community!
              </p>
            ) : (
              <div className="space-y-3">
                {writtenReviews.map((review) => (
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
                    <p className="text-foreground">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
