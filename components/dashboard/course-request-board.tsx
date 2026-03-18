'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpenText, HandHeart, Send, Users } from 'lucide-react';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type CourseRequestBoardProps = {
  mode: 'requester' | 'tutor';
};

export default function CourseRequestBoard({ mode }: CourseRequestBoardProps) {
  const {
    currentUser,
    courseRequests,
    courseRequestInterests,
    createCourseRequest,
    toggleCourseRequestInterest,
    getUserById,
  } = useApp();
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const interestsByRequest = useMemo(() => {
    const mapped = new Map<string, typeof courseRequestInterests>();

    courseRequestInterests.forEach((interest) => {
      const existing = mapped.get(interest.requestId) ?? [];
      existing.push(interest);
      mapped.set(interest.requestId, existing);
    });

    return mapped;
  }, [courseRequestInterests]);

  const ownRequests = useMemo(() => {
    if (!currentUser) return [];
    return courseRequests.filter((request) => request.requesterUserId === currentUser.id);
  }, [courseRequests, currentUser]);

  const tutorVisibleRequests = useMemo(() => {
    if (!currentUser) return [];
    return courseRequests.filter(
      (request) => request.status === 'open' && request.requesterUserId !== currentUser.id
    );
  }, [courseRequests, currentUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!courseCode.trim() || !courseName.trim() || !details.trim()) {
      toast.error('Add the course code, course name, and what help you need.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCourseRequest(courseCode, courseName, details);
      setCourseCode('');
      setCourseName('');
      setDetails('');
      toast.success('Course request posted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create this course request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleInterest = async (requestId: string) => {
    setPendingRequestId(requestId);

    try {
      const interested = await toggleCourseRequestInterest(requestId);
      toast.success(interested ? 'Interest noted.' : 'Interest removed.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update your interest.');
    } finally {
      setPendingRequestId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  if (mode === 'requester') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Request A Course
            </CardTitle>
            <CardDescription>
              Need help with a course you have not found yet? Post it here and tutors can raise their hands.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="course-code">
                    Course code
                  </label>
                  <Input
                    id="course-code"
                    value={courseCode}
                    onChange={(event) => setCourseCode(event.target.value)}
                    placeholder="CSC 201"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="course-name">
                    Course name
                  </label>
                  <Input
                    id="course-name"
                    value={courseName}
                    onChange={(event) => setCourseName(event.target.value)}
                    placeholder="Data Structures"
                    maxLength={80}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="course-details">
                  What help do you need?
                </label>
                <Textarea
                  id="course-details"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Mention the topics, exam prep, assignments, or preferred schedule."
                  className="min-h-28"
                  maxLength={400}
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                Post Request
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5 text-primary" />
              Your Course Requests
            </CardTitle>
            <CardDescription>Track the tutors who have shown interest in helping you.</CardDescription>
          </CardHeader>
          <CardContent>
            {ownRequests.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">
                You have not posted any course requests yet.
              </p>
            ) : (
              <div className="space-y-4">
                {ownRequests.map((request) => {
                  const interests = interestsByRequest.get(request.id) ?? [];
                  const interestedTutorNames = interests
                    .map((interest) => getUserById(interest.tutorUserId)?.name || 'Tutor')
                    .filter(Boolean);

                  return (
                    <div key={request.id} className="rounded-xl border border-border bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {request.courseCode} - {request.courseName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Posted {request.createdAt.toLocaleString()}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {interests.length} tutor{interests.length === 1 ? '' : 's'} interested
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.details}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {interestedTutorNames.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            No tutor has shown interest yet.
                          </span>
                        ) : (
                          interestedTutorNames.map((name) => (
                            <span
                              key={`${request.id}-${name}`}
                              className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                            >
                              {name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="h-5 w-5 text-primary" />
          Course Requests From Learners
        </CardTitle>
        <CardDescription>
          Review open course requests and indicate interest when you can teach the course.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tutorVisibleRequests.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            There are no open course requests right now.
          </p>
        ) : (
          <div className="space-y-4">
            {tutorVisibleRequests.map((request) => {
              const requesterName = getUserById(request.requesterUserId)?.name || 'Learner';
              const interests = interestsByRequest.get(request.id) ?? [];
              const isInterested = interests.some((interest) => interest.tutorUserId === currentUser.id);

              return (
                <div key={request.id} className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {request.courseCode} - {request.courseName}
                        </p>
                        <span className="rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                          Requested by {requesterName}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.details}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{request.createdAt.toLocaleString()}</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {interests.length} tutor{interests.length === 1 ? '' : 's'} interested
                        </span>
                      </div>
                    </div>
                    <Button
                      variant={isInterested ? 'secondary' : 'outline'}
                      onClick={() => void handleToggleInterest(request.id)}
                      disabled={pendingRequestId === request.id}
                    >
                      {isInterested ? 'Interested' : 'I Can Teach This'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
