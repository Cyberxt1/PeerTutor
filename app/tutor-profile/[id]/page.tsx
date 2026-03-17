'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { Star, Clock, Check, BookOpen, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/header';

export default function TutorProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { currentUser, getTutorById, getReviews, getTutorCourseOptions, createBooking, platformSettings } = useApp();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const tutor = getTutorById(id);
  const reviews = getReviews(id);
  const tutorCourses = tutor ? getTutorCourseOptions(tutor.id) : [];
  const selectedCourse = tutorCourses.find((course) => course.id === selectedSubjectId);

  const whatsappNumber = tutor?.user.phone ? tutor.user.phone.replace(/\D/g, '') : '';
  const normalizedWhatsappNumber = whatsappNumber.startsWith('0')
    ? `234${whatsappNumber.slice(1)}`
    : whatsappNumber;
  const contactMessage = tutor
    ? `Hello ${tutor.user.name}, I found your profile on CampusTutor and I would like to ask about ${selectedCourse?.label || 'one of your courses'}. Are you available to chat about tutoring?`
    : '';
  const whatsappLink = normalizedWhatsappNumber
    ? `https://wa.me/${normalizedWhatsappNumber}?text=${encodeURIComponent(contactMessage)}`
    : '';
  const emailLink = tutor?.user.email
    ? `mailto:${tutor.user.email}?subject=${encodeURIComponent(`CampusTutor enquiry for ${tutor.user.name}`)}&body=${encodeURIComponent(contactMessage)}`
    : '';

  if (!tutor) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Tutor not found</h1>
            <Button asChild>
              <Link href="/search-tutors">Back to Search</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const handleBooking = async () => {
    if (!currentUser) {
      router.push('/auth/signup');
      return;
    }

    if (currentUser.role === 'tutor') {
      alert('Tutors cannot book sessions');
      return;
    }

    if (!selectedSubjectId || !selectedDate || !selectedTime) {
      alert('Please choose a course, date, and time');
      return;
    }

    const sessionDate = new Date(`${selectedDate}T${selectedTime}`);

    try {
      await createBooking(tutor.id, selectedSubjectId, sessionDate, 60);

      setShowBookingModal(false);
      setSelectedSubjectId('');
      setSelectedDate('');
      setSelectedTime('');
      alert('Booking request sent! The tutor will confirm shortly.');
      router.push('/student/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create booking right now.');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {!platformSettings.allowTutorBrowsing && (
            <Card className="mb-6 border-border/60 bg-card/90">
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground">
                  Tutor browsing is temporarily paused by the administrator, so profile access is limited right now.
                </p>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/search-tutors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Search
            </Link>
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <img
                    src={tutor.user.profileImage}
                    alt={tutor.user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">{tutor.user.name}</h1>
                      {tutor.verificationStatus === 'verified' && (
                        <span title="Verified">
                          <Check className="w-6 h-6 text-green-600" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 fill-primary text-primary" />
                        <span className="font-semibold text-lg">{tutor.rating}</span>
                        <span className="text-muted-foreground">({tutor.reviewCount} reviews)</span>
                      </div>
                    </div>
                    <p className="text-lg text-foreground mb-2">{tutor.bio}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:text-right">
                  <div className="text-4xl font-bold text-primary">NGN {tutor.hourlyRate.toLocaleString()}</div>
                  <p className="text-muted-foreground">per hour</p>
                  <p className={`text-sm font-medium ${tutor.isAvailable ? 'text-accent' : 'text-muted-foreground'}`}>
                    {tutor.isAvailable ? 'Available for booking' : 'Currently unavailable'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tutorCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{course.code}</p>
                          <p className="text-xs text-muted-foreground">{course.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!tutor.isAvailable ? (
                    <p className="text-muted-foreground">This tutor is not accepting bookings right now.</p>
                  ) : tutor.availability.length === 0 ? (
                    <p className="text-muted-foreground">Available for bookings. Specific time slots have not been added yet.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {tutor.availability.map((slot, idx) => {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return (
                          <div key={idx} className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                            <p className="font-semibold text-foreground">{days[slot.dayOfWeek]}</p>
                            <p className="text-sm text-muted-foreground">
                              {slot.startTime} - {slot.endTime}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews ({reviews.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground">No reviews yet</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-border pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-sm">{review.rating}/5</span>
                        </div>
                        <p className="text-foreground text-sm">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Book a Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentUser ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Sign in to book a session</p>
                      <Button asChild className="w-full bg-primary hover:bg-primary/90">
                        <Link href="/auth/signup">Get Started</Link>
                      </Button>
                    </div>
                  ) : currentUser.role === 'tutor' ? (
                    <p className="text-sm text-center text-muted-foreground">Tutors cannot book sessions</p>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          if (!showBookingModal && tutorCourses[0]) {
                            setSelectedSubjectId((prev) => prev || tutorCourses[0].id);
                          }
                          setShowBookingModal(!showBookingModal);
                        }}
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={
                          tutorCourses.length === 0 ||
                          !tutor.isAvailable ||
                          !platformSettings.allowTutorBrowsing ||
                          !platformSettings.allowBookings
                        }
                      >
                        {!platformSettings.allowTutorBrowsing
                          ? 'Tutor Browsing Paused'
                          : !platformSettings.allowBookings
                            ? 'Bookings Paused'
                          : !tutor.isAvailable
                          ? 'Currently Unavailable'
                          : tutorCourses.length === 0
                            ? 'No Courses Available'
                            : showBookingModal
                              ? 'Close Booking'
                              : 'Book Session'}
                      </Button>

                      {!platformSettings.allowBookings && (
                        <p className="text-sm text-center text-muted-foreground">
                          The admin has temporarily paused new booking requests.
                        </p>
                      )}

                      {showBookingModal && (
                        <div className="space-y-3 pt-4 border-t border-border">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Course Needed</label>
                            <select
                              value={selectedSubjectId}
                              onChange={(e) => setSelectedSubjectId(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            >
                              <option value="">Select a course</option>
                              {tutorCourses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Preferred Date</label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Preferred Time</label>
                            <input
                              type="time"
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            />
                          </div>

                          <Button onClick={() => void handleBooking()} className="w-full bg-accent hover:bg-accent/90">
                            Confirm Booking
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  <hr className="my-4" />

                  <div className="space-y-3">
                    {tutor.user.email ? (
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <a href={emailLink}>
                          <Mail className="w-4 h-4" />
                          Send Email
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" disabled>
                        <Mail className="w-4 h-4" />
                        Email Unavailable
                      </Button>
                    )}

                    {normalizedWhatsappNumber ? (
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <a href={whatsappLink} target="_blank" rel="noreferrer">
                          <MessageCircle className="w-4 h-4" />
                          Chat on WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full gap-2" disabled>
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp Unavailable
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
