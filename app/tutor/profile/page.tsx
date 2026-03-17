'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/lib/context';
import type { TutorCourse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2, Mail, Phone, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TutorProfilePage() {
  const {
    currentUser,
    getTutorByUserId,
    getTutorCourseOptions,
    updateUserProfile,
    updateTutorProfile,
    refreshUser,
  } = useApp();
  const tutorProfile = currentUser ? getTutorByUserId(currentUser.id) : undefined;

  const existingCourses = useMemo(() => {
    if (!tutorProfile) return [];

    return tutorProfile.courses.length > 0
      ? tutorProfile.courses
      : getTutorCourseOptions(tutorProfile.id).map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }));
  }, [getTutorCourseOptions, tutorProfile]);

  const [bio, setBio] = useState(tutorProfile?.bio || '');
  const [hourlyRate, setHourlyRate] = useState(tutorProfile?.hourlyRate.toString() || '2000');
  const [isAvailable, setIsAvailable] = useState(tutorProfile?.isAvailable ?? false);
  const [courses, setCourses] = useState<TutorCourse[]>(existingCourses);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!tutorProfile || !currentUser) return;

    setBio(tutorProfile.bio || '');
    setHourlyRate(tutorProfile.hourlyRate.toString() || '2000');
    setIsAvailable(tutorProfile.isAvailable ?? false);
    setCourses(existingCourses);
    setEmail(currentUser.email || '');
    setPhone(currentUser.phone || '');
  }, [currentUser, existingCourses, tutorProfile]);

  const handleAddCourse = () => {
    if (!courseCode.trim() || !courseName.trim()) {
      setMessageType('error');
      setMessage('Enter both a course code and course name.');
      return;
    }

    if (courses.length >= 3) {
      setMessageType('error');
      setMessage('A tutor can list a maximum of 3 courses.');
      return;
    }

    const normalizedCode = courseCode.trim().toUpperCase();

    if (courses.some((course) => course.code.toUpperCase() === normalizedCode)) {
      setMessageType('error');
      setMessage('That course code is already in your list.');
      return;
    }

    setCourses((prev) => [
      ...prev,
      {
        id: `course-${Date.now()}`,
        code: normalizedCode,
        name: courseName.trim(),
      },
    ]);
    setCourseCode('');
    setCourseName('');
    setMessage('');
  };

  const handleRemoveCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((course) => course.id !== courseId));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!currentUser) {
        throw new Error('No tutor is signed in.');
      }

      if (courses.length === 0) {
        throw new Error('Add at least one course before saving your tutor profile.');
      }

      await updateUserProfile({
        email: email.trim(),
        phone: phone.trim(),
        bio,
      });

      await updateTutorProfile({
        bio,
        hourlyRate: Math.max(0, Number(hourlyRate) || 0),
        isAvailable,
        courses: courses.slice(0, 3),
      });

      await refreshUser();
      setMessageType('success');
      setMessage('Tutor profile updated successfully!');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tutorProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tutor profile not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">Your Tutor Profile</h1>
      <p className="text-muted-foreground mb-8">Add your courses, set your availability, and choose your pay per hour in Naira.</p>

      {message && (
        <Alert variant={messageType === 'success' ? 'default' : 'destructive'} className="mb-6">
          {messageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Summary</CardTitle>
                  <CardDescription>These details help learners understand what you teach and whether you are open for new bookings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentUser?.profileImage}
                      alt={currentUser?.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{currentUser?.name}</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                  </div>

                  <Field>
                    <FieldLabel>Short Bio</FieldLabel>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell learners what you teach and how you like to tutor..."
                      className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                      disabled={loading}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Pay Per Hour (Naira)</FieldLabel>
                      <Input
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="2000"
                        min="0"
                        step="500"
                        disabled={loading}
                      />
                    </Field>

                    <div className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="is-available"
                          checked={isAvailable}
                          onCheckedChange={(checked) => setIsAvailable(Boolean(checked))}
                          disabled={loading}
                        />
                        <label htmlFor="is-available" className="cursor-pointer">
                          <p className="font-medium text-foreground">I&apos;m available</p>
                          <p className="text-sm text-muted-foreground">Learners can book you when this is turned on.</p>
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle>Your Courses</CardTitle>
                  <CardDescription>Add up to 3 courses with a course code and course name.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                    <Input
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      placeholder="CSC101"
                      disabled={loading || courses.length >= 3}
                    />
                    <Input
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      placeholder="Introduction to Programming"
                      disabled={loading || courses.length >= 3}
                    />
                    <Button type="button" onClick={handleAddCourse} disabled={loading || courses.length >= 3}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No courses added yet.</p>
                    ) : (
                      courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                          <div>
                            <p className="font-semibold text-foreground">{course.code}</p>
                            <p className="text-sm text-muted-foreground">{course.name}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveCourse(course.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground">{courses.length}/3 courses added</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                  <CardDescription>Add the email and phone number learners can use to reach you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel>Email Address</FieldLabel>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tutor@example.com"
                          className="pl-9"
                          disabled={loading}
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08012345678"
                          className="pl-9"
                          disabled={loading}
                        />
                      </div>
                    </Field>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Learners will see buttons to send you an email or start a WhatsApp chat. The WhatsApp link will include a ready-made message to make it easier for them to reach out.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Button onClick={() => void handleSaveProfile()} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Tutor Profile'
            )}
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tutor Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <p className={`font-semibold ${isAvailable ? 'text-accent' : 'text-muted-foreground'}`}>
                  {isAvailable ? 'Available for bookings' : 'Not available right now'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pay Per Hour</p>
                <p className="text-2xl font-bold text-primary">NGN {Number(hourlyRate || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Courses</p>
                <p className="font-medium text-foreground">{courses.length} listed</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phone</p>
                <p className="font-medium text-foreground">{phone || 'Not added yet'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium text-foreground">{email || 'Not added yet'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rating</p>
                <p className="font-medium text-foreground">{tutorProfile.rating} / 5.0</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>You can add a maximum of 3 courses.</p>
              <p>Each course must include both a code and a name.</p>
              <p>Learners can only book from the courses you list here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
