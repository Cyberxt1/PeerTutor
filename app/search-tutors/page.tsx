'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Star } from 'lucide-react';
import { useApp } from '@/lib/context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SearchTutorsPage() {
  const { tutors, getAllTutorCourses, getTutorCourseOptions, platformSettings } = useApp();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState(0);

  const courses = getAllTutorCourses();

  const filteredTutors = useMemo(() => {
    return tutors.filter((tutor) => {
      const tutorCourses = getTutorCourseOptions(tutor.id);
      const query = searchQuery.toLowerCase();
      const matchesSubject = !selectedSubject || tutorCourses.some((course) => course.id === selectedSubject);
      const matchesSearch =
        !searchQuery ||
        tutor.user.name.toLowerCase().includes(query) ||
        tutorCourses.some(
          (course) =>
            course.code.toLowerCase().includes(query) || course.name.toLowerCase().includes(query)
        );
      const matchesRating = tutor.rating >= minRating;
      return matchesSubject && matchesSearch && matchesRating;
    });
  }, [getTutorCourseOptions, minRating, searchQuery, selectedSubject, tutors]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <section className="border-b border-border bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-foreground sm:text-4xl">Find Your Perfect Tutor</h1>

          {!platformSettings.allowTutorBrowsing && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Tutor browsing is temporarily paused by the administrator. Please check back later.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Search by name</label>
                <Input
                  placeholder="Search tutors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  disabled={!platformSettings.allowTutorBrowsing}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Course</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={!platformSettings.allowTutorBrowsing}
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-w-xs">
              <label className="mb-2 block text-sm font-medium text-foreground">Minimum Rating</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="flex-1"
                  disabled={!platformSettings.allowTutorBrowsing}
                />
                <span className="min-w-12 text-sm font-medium text-muted-foreground">{minRating.toFixed(1)}★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {!platformSettings.allowTutorBrowsing ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">Tutor profiles are hidden right now.</p>
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No tutors found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubject('');
                setSearchQuery('');
                setMinRating(0);
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTutors.map((tutor) => (
              <Link key={tutor.id} href={`/tutor-profile/${tutor.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex flex-1 items-center gap-3">
                        <img
                          src={tutor.user.profileImage}
                          alt={tutor.user.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tutor.user.name}</CardTitle>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span className="font-semibold">{tutor.rating}</span>
                            <span className="text-muted-foreground">({tutor.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      {tutor.verificationStatus === 'verified' && <Check className="h-5 w-5 text-green-600" />}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">Courses</p>
                      <div className="flex flex-wrap gap-2">
                        {getTutorCourseOptions(tutor.id).map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                          >
                            {course.code}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-2xl font-bold text-primary">NGN {tutor.hourlyRate.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">per hour</p>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">{tutor.bio}</p>

                    <Button className="w-full bg-primary hover:bg-primary/90">View Profile</Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
