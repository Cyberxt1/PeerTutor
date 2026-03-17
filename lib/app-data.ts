import type {
  Booking,
  Review,
  Subject,
  TutorCourse,
  TutorRecord,
  User,
  UserRole,
} from '@/lib/types';

export function normalizeDate(value?: Date | string | number | null) {
  if (!value) return new Date();
  return value instanceof Date ? value : new Date(value);
}

export function createCourse(id: string, code = '', name = ''): TutorCourse {
  return { id, code, name };
}

export function createFallbackAvatar(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return `https://placehold.co/200x200/F1F5F9/0F172A?text=${encodeURIComponent(initials || 'CT')}`;
}

export function getTutorCourseOptions(tutor: TutorRecord | undefined, subjects: Subject[]) {
  if (!tutor) return [];

  if (tutor.courses.length > 0) {
    return tutor.courses.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      label: `${course.code} - ${course.name}`,
    }));
  }

  return tutor.subjects
    .map((subjectId) => subjects.find((subject) => subject.id === subjectId))
    .filter((subject): subject is Subject => Boolean(subject))
    .map((subject) => ({
      id: subject.id,
      code: subject.id.toUpperCase(),
      name: subject.name,
      label: subject.name,
    }));
}

export function getAllTutorCourses(tutors: TutorRecord[], subjects: Subject[]) {
  const seen = new Set<string>();

  return tutors.flatMap((tutor) =>
    getTutorCourseOptions(tutor, subjects).filter((course) => {
      if (seen.has(course.id)) return false;
      seen.add(course.id);
      return true;
    })
  );
}

export function getCourseLabel(tutors: TutorRecord[], subjects: Subject[], tutorId: string, courseId: string) {
  const tutor = tutors.find((existingTutor) => existingTutor.id === tutorId);
  const course = getTutorCourseOptions(tutor, subjects).find((item) => item.id === courseId);
  return course?.label || 'Unknown course';
}

export function getTutorById(tutors: TutorRecord[], tutorId: string) {
  return tutors.find((tutor) => tutor.id === tutorId);
}

export function getTutorByUserId(tutors: TutorRecord[], userId: string) {
  return tutors.find((tutor) => tutor.userId === userId);
}

export function getUserById(users: User[], userId: string) {
  return users.find((user) => user.id === userId);
}

export function getBookingsForUser(bookings: Booking[], userId: string, role: UserRole) {
  if (!userId) return [];

  return role === 'student'
    ? bookings.filter((booking) => booking.studentId === userId)
    : bookings.filter((booking) => booking.tutorUserId === userId);
}

export function getReviewsForTutor(reviews: Review[], tutorId: string) {
  return reviews.filter((review) => review.tutorId === tutorId);
}
