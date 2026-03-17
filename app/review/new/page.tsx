'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { Star, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function NewReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, bookings, tutors, createReview, getCourseLabel } = useApp();

  const bookingId = searchParams.get('bookingId');
  const tutorId = searchParams.get('tutorId');

  const booking = bookingId ? bookings.find((item) => item.id === bookingId) : null;
  const tutor = tutorId ? tutors.find((item) => item.id === tutorId) : null;

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (booking && tutor && currentUser) {
        await createReview(booking.id, tutor.id, rating, comment);
        setSubmitted(true);
        setTimeout(() => {
          router.push('/student/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!booking || !tutor || !currentUser || currentUser.role !== 'student') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Review Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Unable to create review. Please try again from your dashboard.</p>
            <Button asChild className="w-full">
              <Link href="/student/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-accent" />
            </div>
            <CardTitle>Review Submitted!</CardTitle>
            <CardDescription>Thank you for your feedback. Redirecting...</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/student/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Leave a Review</CardTitle>
            <CardDescription>Share your experience with this tutor</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex items-center gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
              <img
                src={tutor.user.profileImage}
                alt={tutor.user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-foreground">{tutor.user.name}</p>
                <p className="text-sm text-muted-foreground">{getCourseLabel(tutor.id, booking.subjectId)}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Field>
                <FieldLabel>Your Rating</FieldLabel>
                <div className="space-y-3">
                  <div className="flex gap-2 text-4xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-10 h-10 ${star <= rating ? 'fill-primary text-primary' : 'text-muted'}`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rating === 5 && 'Excellent! This tutor was fantastic.'}
                    {rating === 4 && 'Good! This tutor was helpful.'}
                    {rating === 3 && 'Okay. This tutor was decent.'}
                    {rating === 2 && 'Fair. This tutor had some issues.'}
                    {rating === 1 && "Poor. This wasn't a good experience."}
                  </p>
                </div>
              </Field>

              <Field>
                <FieldLabel>Your Review (Optional)</FieldLabel>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience. What did you learn? How was the teaching style? Any suggestions?"
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={5}
                  maxLength={500}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">{comment.length}/500 characters</p>
              </Field>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your review will help other students find great tutors. Please be honest and constructive.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function NewReviewFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Loading review form...</CardTitle>
          <CardDescription>Please wait a moment.</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense fallback={<NewReviewFallback />}>
      <NewReviewContent />
    </Suspense>
  );
}
