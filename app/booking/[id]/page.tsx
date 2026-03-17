'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { canBookingBeCompleted, getBookingEndTime } from '@/lib/booking';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Calendar, Clock, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/layout/header';

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const {
    currentUser,
    bookings,
    tutors,
    getUserById,
    getCourseLabel,
    confirmBooking,
    cancelBooking,
    completeBooking,
  } = useApp();
  const router = useRouter();

  const booking = bookings.find((item) => item.id === id);
  const tutor = booking ? tutors.find((item) => item.id === booking.tutorId) : null;
  const student = booking ? getUserById(booking.studentId) : null;
  const courseLabel = booking && tutor ? getCourseLabel(tutor.id, booking.subjectId) : null;

  if (!booking || !tutor || !student || !courseLabel) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Booking not found</h1>
            <Button asChild>
              <Link href="/student/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const canEdit = currentUser?.id === student.id;
  const canApprove = currentUser?.id === tutor.userId;
  const canComplete = canBookingBeCompleted(booking) && Boolean(canEdit || canApprove);
  const sessionEndTime = getBookingEndTime(booking.sessionDate, booking.duration);

  const handleCancelBooking = async () => {
    try {
      await cancelBooking(booking.id);
      alert('Booking cancelled');
      router.push('/student/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to cancel this booking right now.');
    }
  };

  const handleApproveBooking = async () => {
    try {
      await confirmBooking(booking.id);
      alert('Booking confirmed!');
      router.push('/tutor/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to confirm this booking right now.');
    }
  };

  const handleDeclineBooking = async () => {
    try {
      await cancelBooking(booking.id);
      alert('Booking declined.');
      router.push('/tutor/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to decline this booking right now.');
    }
  };

  const handleCompleteBooking = async () => {
    try {
      await completeBooking(booking.id);
      alert('Session marked as completed.');
      router.push(currentUser?.role === 'student' ? '/student/dashboard' : '/tutor/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to mark this session as completed right now.');
    }
  };

  const statusColor = {
    pending: 'bg-orange-500/20 text-orange-700',
    confirmed: 'bg-accent/20 text-accent',
    completed: 'bg-green-500/20 text-green-700',
    cancelled: 'bg-red-500/20 text-red-700',
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href={currentUser?.role === 'student' ? '/student/dashboard' : '/tutor/dashboard'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <CardTitle className="text-2xl mb-2">Booking Details</CardTitle>
                      <CardDescription>Booking ID: {booking.id}</CardDescription>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-medium ${statusColor[booking.status]}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-semibold text-foreground">{courseLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold text-foreground">
                          {new Date(booking.sessionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold text-foreground">{booking.duration} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-semibold text-foreground">
                          {new Date(booking.sessionDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-foreground">{booking.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.profileImage}
                        alt={student.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{student.name}</p>
                        <p className="text-sm text-muted-foreground">Student</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={tutor.user.profileImage}
                        alt={tutor.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{tutor.user.name}</p>
                        <p className="text-sm text-muted-foreground">Tutor</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {booking.status === 'pending' && canApprove && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      Booking Pending Approval
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button onClick={() => void handleApproveBooking()} className="bg-primary hover:bg-primary/90">
                      Confirm Booking
                    </Button>
                    <Button variant="outline" onClick={() => void handleDeclineBooking()}>
                      Decline
                    </Button>
                  </CardContent>
                </Card>
              )}

              {booking.status === 'confirmed' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      Session Confirmed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Session is scheduled for {new Date(booking.sessionDate).toLocaleDateString()}. A video link will be shared 15 minutes before the session.
                      </AlertDescription>
                    </Alert>
                    <Button className="w-full bg-primary hover:bg-primary/90">Open Session Room</Button>
                    {canComplete ? (
                      <Button variant="outline" className="w-full" onClick={() => void handleCompleteBooking()}>
                        Mark Session as Completed
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        You can mark this session as completed after{' '}
                        {sessionEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on{' '}
                        {sessionEndTime.toLocaleDateString()}.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Cost</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hourly Rate</span>
                    <span className="font-medium text-foreground">NGN {tutor.hourlyRate.toLocaleString()}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium text-foreground">{booking.duration} min</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-primary text-lg">
                      NGN {((booking.duration / 60) * tutor.hourlyRate).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Requested</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {(booking.status === 'confirmed' || booking.status === 'completed') && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Confirmed</p>
                          <p className="text-xs text-muted-foreground">Awaiting session date</p>
                        </div>
                      </div>
                    )}

                    {booking.status === 'completed' && (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Completed</p>
                          <p className="text-xs text-muted-foreground">Session finished</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {booking.status === 'pending' && canEdit && (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={() => void handleCancelBooking()}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
