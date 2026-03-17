'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/client';
import { createFallbackAvatar } from '@/lib/app-data';
import { canBookingBeCompleted, hasBookingConflict, isSessionWithinAvailability } from '@/lib/booking';
import type {
  AvailabilitySlot,
  Booking,
  Review,
  TutorCourse,
  TutorRecord,
  User,
  UserRole,
} from '@/lib/types';

type Unsubscribe = () => void;

function getSnapshotErrorMessage(error: unknown, label: string) {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'unknown';

  if (code === 'permission-denied') {
    return `Firestore access to ${label} was denied. Deploy your Firestore rules to the Firebase project and make sure you are signed in.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `Unable to subscribe to ${label}.`;
}

export type StoredTutorProfile = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio: string;
  subjects: string[];
  courses: TutorCourse[];
  hourlyRate: number;
  isAvailable: boolean;
  availability: AvailabilitySlot[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
};

function assertConfigured() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error('Firebase is not configured yet.');
  }
}

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function mapUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'CampusTutor User',
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'tutor' ? 'tutor' : 'student',
    profileImage:
      typeof data.profileImage === 'string' && data.profileImage
        ? data.profileImage
        : createFallbackAvatar(typeof data.name === 'string' ? data.name : 'CampusTutor User'),
    bio: typeof data.bio === 'string' ? data.bio : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    createdAt: parseTimestamp(data.createdAt),
  };
}

function mapTutorProfile(id: string, data: Record<string, unknown>): StoredTutorProfile {
  const courses = Array.isArray(data.courses)
    ? data.courses
        .map((course) => {
          if (!course || typeof course !== 'object') return null;
          const courseRecord = course as Record<string, unknown>;
          return {
            id: typeof courseRecord.id === 'string' ? courseRecord.id : `course-${Date.now()}`,
            code: typeof courseRecord.code === 'string' ? courseRecord.code : '',
            name: typeof courseRecord.name === 'string' ? courseRecord.name : '',
          };
        })
        .filter((course): course is TutorCourse => Boolean(course))
    : [];

  const availability = Array.isArray(data.availability)
    ? data.availability
        .map((slot) => {
          if (!slot || typeof slot !== 'object') return null;
          const slotRecord = slot as Record<string, unknown>;
          return {
            dayOfWeek: typeof slotRecord.dayOfWeek === 'number' ? slotRecord.dayOfWeek : 0,
            startTime: typeof slotRecord.startTime === 'string' ? slotRecord.startTime : '09:00',
            endTime: typeof slotRecord.endTime === 'string' ? slotRecord.endTime : '17:00',
          };
        })
        .filter((slot): slot is AvailabilitySlot => Boolean(slot))
    : [];

  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : id,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'CampusTutor Tutor',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    profileImage:
      typeof data.profileImage === 'string' && data.profileImage
        ? data.profileImage
        : createFallbackAvatar(typeof data.displayName === 'string' ? data.displayName : 'CampusTutor Tutor'),
    bio:
      typeof data.bio === 'string' && data.bio
        ? data.bio
        : 'Tell students what you can help them achieve and how you like to teach.',
    subjects: Array.isArray(data.subjects) ? data.subjects.filter((subject): subject is string => typeof subject === 'string') : [],
    courses,
    hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : 2000,
    isAvailable: Boolean(data.isAvailable),
    availability,
    verificationStatus:
      data.verificationStatus === 'verified' || data.verificationStatus === 'rejected'
        ? data.verificationStatus
        : 'pending',
    createdAt: parseTimestamp(data.createdAt),
  };
}

function mapBooking(id: string, data: Record<string, unknown>): Booking {
  const participantIds = Array.isArray(data.participantIds)
    ? data.participantIds.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    id,
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    tutorId: typeof data.tutorId === 'string' ? data.tutorId : '',
    tutorUserId: typeof data.tutorUserId === 'string' ? data.tutorUserId : '',
    participantIds,
    subjectId: typeof data.subjectId === 'string' ? data.subjectId : '',
    sessionDate: parseTimestamp(data.sessionDate),
    duration: typeof data.duration === 'number' ? data.duration : 60,
    status:
      data.status === 'confirmed' || data.status === 'completed' || data.status === 'cancelled'
        ? data.status
        : 'pending',
    notes: typeof data.notes === 'string' ? data.notes : '',
    createdAt: parseTimestamp(data.createdAt),
  };
}

function mapReview(id: string, data: Record<string, unknown>): Review {
  return {
    id,
    bookingId: typeof data.bookingId === 'string' ? data.bookingId : '',
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    tutorId: typeof data.tutorId === 'string' ? data.tutorId : '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    comment: typeof data.comment === 'string' ? data.comment : '',
    createdAt: parseTimestamp(data.createdAt),
  };
}

export function buildTutorRecords(
  profiles: StoredTutorProfile[],
  users: User[],
  reviews: Review[]
): TutorRecord[] {
  return profiles.map((profile) => {
    const user =
      users.find((candidate) => candidate.id === profile.userId) || {
        id: profile.userId,
        name: profile.displayName,
        email: profile.email,
        role: 'tutor' as const,
        profileImage: profile.profileImage || createFallbackAvatar(profile.displayName),
        bio: profile.bio,
        phone: profile.phone,
        createdAt: profile.createdAt,
      };

    const tutorReviews = reviews.filter((review) => review.tutorId === profile.id);
    const reviewCount = tutorReviews.length;
    const rating =
      reviewCount === 0
        ? 0
        : Math.round(
            (tutorReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10
          ) / 10;

    return {
      id: profile.id,
      userId: profile.userId,
      user,
      subjects: profile.subjects,
      courses: profile.courses,
      hourlyRate: profile.hourlyRate,
      bio: profile.bio,
      isAvailable: profile.isAvailable,
      availability: profile.availability,
      rating,
      reviewCount,
      verificationStatus: profile.verificationStatus,
      createdAt: profile.createdAt,
    };
  });
}

async function createUserDocument(firebaseUser: FirebaseAuthUser, name: string, role: UserRole) {
  assertConfigured();

  const userDoc = {
    name,
    email: firebaseUser.email || '',
    role,
    profileImage: createFallbackAvatar(name),
    bio: '',
    phone: '',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db!, 'users', firebaseUser.uid), userDoc);

  if (role === 'tutor') {
    await setDoc(doc(db!, 'tutorProfiles', firebaseUser.uid), {
      userId: firebaseUser.uid,
      displayName: name,
      email: firebaseUser.email || '',
      phone: '',
      profileImage: createFallbackAvatar(name),
      bio: 'Tell students what you can help them achieve and how you like to teach.',
      subjects: [],
      courses: [],
      hourlyRate: 2000,
      isAvailable: false,
      availability: [],
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
    });
  }
}

export async function getCurrentUserProfile(userId: string) {
  assertConfigured();
  const snapshot = await getDoc(doc(db!, 'users', userId));
  if (!snapshot.exists()) return null;
  return mapUser(snapshot.id, snapshot.data());
}

export function subscribeToAuth(callback: (firebaseUser: FirebaseAuthUser | null) => void): Unsubscribe {
  assertConfigured();
  return onAuthStateChanged(auth!, callback);
}

export function subscribeToTutorProfiles(
  callback: (profiles: StoredTutorProfile[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'tutorProfiles'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapTutorProfile(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'tutor profiles'));
    },
  );
}

export function subscribeToReviews(
  callback: (reviews: Review[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'reviews'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapReview(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'reviews'));
    },
  );
}

export function subscribeToUsers(
  callback: (users: User[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'users'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapUser(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'users'));
    },
  );
}

export function subscribeToBookings(
  userId: string,
  callback: (bookings: Booking[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(
      collection(db!, 'bookings'),
      where('participantIds', 'array-contains', userId)
    ),
    (snapshot) => {
      const bookings = snapshot.docs
        .map((docSnapshot) => mapBooking(docSnapshot.id, docSnapshot.data()))
        .sort((firstBooking, secondBooking) => secondBooking.createdAt.getTime() - firstBooking.createdAt.getTime());

      callback(bookings);
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'bookings'));
    },
  );
}

export async function loginWithEmail(email: string, password: string) {
  assertConfigured();
  const credentials = await signInWithEmailAndPassword(auth!, email, password);
  const profile = await getCurrentUserProfile(credentials.user.uid);
  if (!profile) {
    throw new Error('Your user profile could not be found.');
  }
  return profile;
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  assertConfigured();
  const credentials = await createUserWithEmailAndPassword(auth!, email, password);
  await createUserDocument(credentials.user, name, role);
  const profile = await getCurrentUserProfile(credentials.user.uid);
  if (!profile) {
    throw new Error('Your account was created, but the profile setup did not complete.');
  }
  return profile;
}

export async function logoutUser() {
  assertConfigured();
  await signOut(auth!);
}

export async function updateUserProfileRecord(
  userId: string,
  currentUser: User,
  updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'bio' | 'profileImage'>>
) {
  assertConfigured();

  if (auth?.currentUser && updates.email && updates.email !== auth.currentUser.email) {
    await updateEmail(auth.currentUser, updates.email);
  }

  const userUpdates = {
    ...(updates.name ? { name: updates.name.trim() } : {}),
    ...(updates.email ? { email: updates.email.trim() } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio.trim() } : {}),
    ...(updates.profileImage ? { profileImage: updates.profileImage } : {}),
  };

  await updateDoc(doc(db!, 'users', userId), userUpdates);

  const tutorProfileRef = doc(db!, 'tutorProfiles', userId);
  const tutorProfileSnapshot = await getDoc(tutorProfileRef);
  if (tutorProfileSnapshot.exists()) {
    await updateDoc(tutorProfileRef, {
      ...(updates.name ? { displayName: updates.name.trim() } : {}),
      ...(updates.email ? { email: updates.email.trim() } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone.trim() } : {}),
      ...(updates.bio !== undefined ? { bio: updates.bio.trim() } : {}),
      ...(updates.profileImage ? { profileImage: updates.profileImage } : {}),
    });
  }

  return {
    ...currentUser,
    ...updates,
    name: updates.name?.trim() ?? currentUser.name,
    email: updates.email?.trim() ?? currentUser.email,
    phone: updates.phone?.trim() ?? currentUser.phone,
    bio: updates.bio?.trim() ?? currentUser.bio,
  };
}

export async function switchUserRoleRecord(user: User, role: UserRole) {
  assertConfigured();

  await updateDoc(doc(db!, 'users', user.id), { role });

  const tutorProfileRef = doc(db!, 'tutorProfiles', user.id);
  const tutorProfileSnapshot = await getDoc(tutorProfileRef);

  if (role === 'tutor' && !tutorProfileSnapshot.exists()) {
    await setDoc(tutorProfileRef, {
      userId: user.id,
      displayName: user.name,
      email: user.email,
      phone: user.phone || '',
      profileImage: user.profileImage || createFallbackAvatar(user.name),
      bio: user.bio || 'Tell students what you can help them achieve and how you like to teach.',
      subjects: [],
      courses: [],
      hourlyRate: 2000,
      isAvailable: false,
      availability: [],
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
    });
  }

  return {
    ...user,
    role,
  };
}

export async function updateTutorProfileRecord(
  user: User,
  updates: {
    bio?: string;
    hourlyRate?: number;
    subjects?: string[];
    courses?: TutorCourse[];
    availability?: AvailabilitySlot[];
    isAvailable?: boolean;
  }
) {
  assertConfigured();

  const tutorProfileRef = doc(db!, 'tutorProfiles', user.id);
  const payload = {
    ...(updates.bio !== undefined ? { bio: updates.bio.trim() } : {}),
    ...(typeof updates.hourlyRate === 'number' ? { hourlyRate: updates.hourlyRate } : {}),
    ...(updates.subjects ? { subjects: updates.subjects } : {}),
    ...(updates.courses ? { courses: updates.courses.slice(0, 3) } : {}),
    ...(updates.availability ? { availability: updates.availability } : {}),
    ...(typeof updates.isAvailable === 'boolean' ? { isAvailable: updates.isAvailable } : {}),
    displayName: user.name,
    email: user.email,
    phone: user.phone || '',
    profileImage: user.profileImage || createFallbackAvatar(user.name),
  };

  const existing = await getDoc(tutorProfileRef);
  if (existing.exists()) {
    await updateDoc(tutorProfileRef, payload);
  } else {
    await setDoc(tutorProfileRef, {
      userId: user.id,
      createdAt: serverTimestamp(),
      verificationStatus: 'pending',
      subjects: [],
      courses: [],
      hourlyRate: 2000,
      isAvailable: false,
      availability: [],
      bio: user.bio || '',
      ...payload,
    });
  }
}

export async function createBookingRecord(
  studentId: string,
  tutorId: string,
  subjectId: string,
  sessionDate: Date,
  duration: number,
  notes?: string
) {
  assertConfigured();

  if (!(sessionDate instanceof Date) || Number.isNaN(sessionDate.getTime())) {
    throw new Error('Please choose a valid session date and time.');
  }

  if (sessionDate.getTime() <= Date.now()) {
    throw new Error('Bookings must be scheduled for a future time.');
  }

  if (duration <= 0) {
    throw new Error('Session duration must be greater than zero.');
  }

  const tutorProfileRef = doc(db!, 'tutorProfiles', tutorId);
  const tutorProfileSnapshot = await getDoc(tutorProfileRef);

  if (!tutorProfileSnapshot.exists()) {
    throw new Error('Tutor availability could not be found.');
  }

  const tutorProfile = mapTutorProfile(tutorProfileSnapshot.id, tutorProfileSnapshot.data());

  if (!tutorProfile.isAvailable) {
    throw new Error('This tutor is not accepting bookings right now.');
  }

  if (!isSessionWithinAvailability(sessionDate, duration, tutorProfile.availability)) {
    throw new Error('That time falls outside the tutor\'s listed availability.');
  }

  const [studentBookingSnapshot, tutorBookingSnapshot] = await Promise.all([
    getDocs(query(collection(db!, 'bookings'), where('participantIds', 'array-contains', studentId))),
    getDocs(query(collection(db!, 'bookings'), where('participantIds', 'array-contains', tutorId))),
  ]);

  const studentBookings = studentBookingSnapshot.docs.map((docSnapshot) =>
    mapBooking(docSnapshot.id, docSnapshot.data())
  );
  const tutorBookings = tutorBookingSnapshot.docs.map((docSnapshot) =>
    mapBooking(docSnapshot.id, docSnapshot.data())
  );

  if (hasBookingConflict(studentBookings, sessionDate, duration)) {
    throw new Error('You already have another booking that overlaps with this time.');
  }

  if (hasBookingConflict(tutorBookings, sessionDate, duration)) {
    throw new Error('This tutor already has another booking that overlaps with this time.');
  }

  const payload = {
    studentId,
    tutorId,
    tutorUserId: tutorId,
    participantIds: [studentId, tutorId],
    subjectId,
    sessionDate,
    duration,
    status: 'pending' as const,
    notes: notes || '',
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, 'bookings'), payload);
  const created = await getDoc(docRef);
  return mapBooking(created.id, created.data() || payload);
}

export async function updateBookingStatusRecord(bookingId: string, status: Booking['status']) {
  assertConfigured();
  const bookingRef = doc(db!, 'bookings', bookingId);
  const existingSnapshot = await getDoc(bookingRef);

  if (!existingSnapshot.exists()) {
    throw new Error('Booking not found.');
  }

  const existingBooking = mapBooking(existingSnapshot.id, existingSnapshot.data());

  if (status === 'confirmed') {
    const [studentBookingSnapshot, tutorBookingSnapshot] = await Promise.all([
      getDocs(query(collection(db!, 'bookings'), where('participantIds', 'array-contains', existingBooking.studentId))),
      getDocs(query(collection(db!, 'bookings'), where('participantIds', 'array-contains', existingBooking.tutorUserId))),
    ]);

    const statusesToCheck: Booking['status'][] = ['confirmed'];
    const studentBookings = studentBookingSnapshot.docs.map((docSnapshot) =>
      mapBooking(docSnapshot.id, docSnapshot.data())
    );
    const tutorBookings = tutorBookingSnapshot.docs.map((docSnapshot) =>
      mapBooking(docSnapshot.id, docSnapshot.data())
    );

    if (
      hasBookingConflict(studentBookings, existingBooking.sessionDate, existingBooking.duration, {
        excludeBookingId: existingBooking.id,
        statuses: statusesToCheck,
      })
    ) {
      throw new Error('The student already has another confirmed booking at this time.');
    }

    if (
      hasBookingConflict(tutorBookings, existingBooking.sessionDate, existingBooking.duration, {
        excludeBookingId: existingBooking.id,
        statuses: statusesToCheck,
      })
    ) {
      throw new Error('This tutor already has another confirmed booking at this time.');
    }
  }

  if (status === 'completed' && !canBookingBeCompleted(existingBooking)) {
    throw new Error('A session can only be completed after its scheduled end time.');
  }

  await updateDoc(bookingRef, { status });
  const snapshot = await getDoc(bookingRef);
  if (!snapshot.exists()) {
    throw new Error('Booking not found.');
  }
  return mapBooking(snapshot.id, snapshot.data());
}

export async function createReviewRecord(
  bookingId: string,
  studentId: string,
  tutorId: string,
  rating: number,
  comment: string
) {
  assertConfigured();

  const payload = {
    bookingId,
    studentId,
    tutorId,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, 'reviews'), payload);
  const created = await getDoc(docRef);
  return mapReview(created.id, created.data() || payload);
}

export async function loadTutorProfilesOnce() {
  assertConfigured();
  const snapshot = await getDocs(query(collection(db!, 'tutorProfiles'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map((docSnapshot) => mapTutorProfile(docSnapshot.id, docSnapshot.data()));
}
