'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { Star, Check } from 'lucide-react';

export default function SearchTutorsPage() {
  const { tutors, getAllTutorCourses, getTutorCourseOptions } = useApp();
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
      <section className="bg-white dark:bg-slate-950 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Find Your Perfect Tutor</h1>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search by name</label>
                <Input
                  placeholder="Search tutors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Course</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
              <label className="block text-sm font-medium text-foreground mb-2">Minimum Rating</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-muted-foreground min-w-12">{minRating.toFixed(1)}★</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12">
        {filteredTutors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No tutors found matching your criteria.</p>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <Link key={tutor.id} href={`/tutor-profile/${tutor.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={tutor.user.profileImage}
                          alt={tutor.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tutor.user.name}</CardTitle>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            <span className="font-semibold">{tutor.rating}</span>
                            <span className="text-muted-foreground">({tutor.reviewCount})</span>
                          </div>
                        </div>
                      </div>
                      {tutor.verificationStatus === 'verified' && <Check className="w-5 h-5 text-green-600" />}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Courses</p>
                      <div className="flex flex-wrap gap-2">
                        {getTutorCourseOptions(tutor.id).map((course) => (
                          <span
                            key={course.id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
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

                    <p className="text-sm text-muted-foreground line-clamp-2">{tutor.bio}</p>

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
