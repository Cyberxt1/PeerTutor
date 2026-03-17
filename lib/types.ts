export type UserRole = 'student' | 'tutor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  bio?: string;
  phone?: string;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface TutorCourse {
  id: string;
  code: string;
  name: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface TutorProfile {
  id: string;
  userId: string;
  subjects: string[];
  courses: TutorCourse[];
  hourlyRate: number;
  bio: string;
  isAvailable: boolean;
  availability: AvailabilitySlot[];
  rating: number;
  reviewCount: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
}

export interface TutorRecord extends TutorProfile {
  user: User;
}

export interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  tutorUserId: string;
  participantIds: string[];
  subjectId: string;
  sessionDate: Date;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  bookingId: string;
  startTime: Date;
  endTime: Date;
  roomUrl?: string;
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type PlatformUpdateCategory = 'announcement' | 'coming-soon' | 'maintenance' | 'feature';

export type PlatformUpdateAudience = 'all' | 'students' | 'tutors';

export interface PlatformUpdate {
  id: string;
  title: string;
  message: string;
  category: PlatformUpdateCategory;
  audience: PlatformUpdateAudience;
  createdAt: Date;
  createdByEmail: string;
  active: boolean;
}
