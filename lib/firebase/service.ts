'use client';

import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase/client';
import { createFallbackAvatar } from '@/lib/app-data';
import { canBookingBeCompleted, hasBookingConflict, isSessionWithinAvailability } from '@/lib/booking';
import { ADMIN_EMAIL, DEFAULT_PLATFORM_SETTINGS, isAdminEmail, normalizeEmail, type PlatformSettings } from '@/lib/platform';
import type {
  AccountStatus,
  AvailabilitySlot,
  Booking,
  CourseRequest,
  CourseRequestInterest,
  PlatformUpdate,
  Review,
  TutorCourse,
  TutorRecord,
  User,
  UserNotification,
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

async function refreshAuthUser(firebaseUser: FirebaseAuthUser | null) {
  if (!firebaseUser) return null;

  try {
    await reload(firebaseUser);
    await firebaseUser.getIdToken(true);
  } catch {
    return auth?.currentUser ?? firebaseUser;
  }

  return auth?.currentUser ?? firebaseUser;
}

function attachAuthState(user: User, firebaseUser?: FirebaseAuthUser | null) {
  const authUser = firebaseUser ?? auth?.currentUser ?? null;

  if (!authUser) {
    return user;
  }

  return {
    ...user,
    emailVerified:
      normalizeEmail(authUser.email) === normalizeEmail(user.email)
        ? authUser.emailVerified
        : user.emailVerified,
  };
}

function parseTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
}

function mapPlatformSettings(data: Record<string, unknown> | undefined): PlatformSettings {
  return {
    adminEmail:
      typeof data?.adminEmail === 'string' && data.adminEmail.trim().length > 0
        ? normalizeEmail(data.adminEmail)
        : ADMIN_EMAIL,
    allowNewSignups:
      typeof data?.allowNewSignups === 'boolean'
        ? data.allowNewSignups
        : DEFAULT_PLATFORM_SETTINGS.allowNewSignups,
    allowTutorBrowsing:
      typeof data?.allowTutorBrowsing === 'boolean'
        ? data.allowTutorBrowsing
        : DEFAULT_PLATFORM_SETTINGS.allowTutorBrowsing,
    allowBookings:
      typeof data?.allowBookings === 'boolean'
        ? data.allowBookings
        : DEFAULT_PLATFORM_SETTINGS.allowBookings,
    allowResources:
      typeof data?.allowResources === 'boolean'
        ? data.allowResources
        : DEFAULT_PLATFORM_SETTINGS.allowResources,
    showBrowseTutorsNav:
      typeof data?.showBrowseTutorsNav === 'boolean'
        ? data.showBrowseTutorsNav
        : DEFAULT_PLATFORM_SETTINGS.showBrowseTutorsNav,
    showAboutNav:
      typeof data?.showAboutNav === 'boolean'
        ? data.showAboutNav
        : DEFAULT_PLATFORM_SETTINGS.showAboutNav,
    showHowItWorksNav:
      typeof data?.showHowItWorksNav === 'boolean'
        ? data.showHowItWorksNav
        : DEFAULT_PLATFORM_SETTINGS.showHowItWorksNav,
    showContactNav:
      typeof data?.showContactNav === 'boolean'
        ? data.showContactNav
        : DEFAULT_PLATFORM_SETTINGS.showContactNav,
    showResourcesNav:
      typeof data?.showResourcesNav === 'boolean'
        ? data.showResourcesNav
        : DEFAULT_PLATFORM_SETTINGS.showResourcesNav,
  };
}

function mapUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'CampusTutor User',
    email: typeof data.email === 'string' ? data.email : '',
    role: data.role === 'tutor' ? 'tutor' : 'student',
    signInCount: typeof data.signInCount === 'number' ? data.signInCount : 1,
    accountStatus:
      data.accountStatus === 'suspended' || data.accountStatus === 'deleted'
        ? data.accountStatus
        : 'active',
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
        : 'Oops! This Tutor forgot to craft a bio.',
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

function mapPlatformUpdate(id: string, data: Record<string, unknown>): PlatformUpdate {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Platform update',
    message: typeof data.message === 'string' ? data.message : '',
    category:
      data.category === 'coming-soon' || data.category === 'maintenance' || data.category === 'feature'
        ? data.category
        : 'announcement',
    audience: data.audience === 'students' || data.audience === 'tutors' ? data.audience : 'all',
    createdAt: parseTimestamp(data.createdAt),
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    active: typeof data.active === 'boolean' ? data.active : true,
  };
}

function mapUserNotification(id: string, data: Record<string, unknown>): UserNotification {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : '',
    title: typeof data.title === 'string' ? data.title : 'Notification',
    message: typeof data.message === 'string' ? data.message : '',
    createdAt: parseTimestamp(data.createdAt),
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    active: typeof data.active === 'boolean' ? data.active : true,
    readAt: data.readAt === null || data.readAt === undefined ? null : parseTimestamp(data.readAt),
    clearedAt: data.clearedAt === null || data.clearedAt === undefined ? null : parseTimestamp(data.clearedAt),
  };
}

function mapCourseRequest(id: string, data: Record<string, unknown>): CourseRequest {
  return {
    id,
    requesterUserId: typeof data.requesterUserId === 'string' ? data.requesterUserId : '',
    requesterRole: data.requesterRole === 'tutor' ? 'tutor' : 'student',
    courseCode: typeof data.courseCode === 'string' ? data.courseCode : '',
    courseName: typeof data.courseName === 'string' ? data.courseName : 'Requested course',
    details: typeof data.details === 'string' ? data.details : '',
    status: data.status === 'closed' ? 'closed' : 'open',
    createdAt: parseTimestamp(data.createdAt),
  };
}

function mapCourseRequestInterest(id: string, data: Record<string, unknown>): CourseRequestInterest {
  return {
    id,
    requestId: typeof data.requestId === 'string' ? data.requestId : '',
    tutorUserId: typeof data.tutorUserId === 'string' ? data.tutorUserId : '',
    createdAt: parseTimestamp(data.createdAt),
  };
}

function getCourseRequestInterestId(requestId: string, tutorUserId: string) {
  return `${requestId}_${tutorUserId}`;
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
        signInCount: 1,
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
  const isAdminAccount = isAdminEmail(firebaseUser.email);
  const storedRole: UserRole = isAdminAccount ? 'student' : role;

  const userDoc = {
    name,
    email: firebaseUser.email || '',
    role: storedRole,
    signInCount: 1,
    accountStatus: 'active' as AccountStatus,
    profileImage: createFallbackAvatar(name),
    bio: '',
    phone: '',
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db!, 'users', firebaseUser.uid), userDoc);

  if (storedRole === 'tutor') {
    await setDoc(doc(db!, 'tutorProfiles', firebaseUser.uid), {
      userId: firebaseUser.uid,
      displayName: name,
      email: firebaseUser.email || '',
      phone: '',
      profileImage: createFallbackAvatar(name),
      bio: 'Oops! This Tutor forgot to craft a bio.',
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
  const refreshedUser = await refreshAuthUser(auth?.currentUser ?? null);
  const snapshot = await getDoc(doc(db!, 'users', userId));
  if (!snapshot.exists()) return null;
  return attachAuthState(mapUser(snapshot.id, snapshot.data()), refreshedUser);
}

export function subscribeToAuth(callback: (firebaseUser: FirebaseAuthUser | null) => void): Unsubscribe {
  assertConfigured();
  return onAuthStateChanged(auth!, async (firebaseUser) => {
    callback(await refreshAuthUser(firebaseUser));
  });
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

export function subscribeToAllBookings(
  callback: (bookings: Booking[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'bookings'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapBooking(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'all bookings'));
    },
  );
}

export function subscribeToPlatformSettings(
  callback: (settings: PlatformSettings) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    doc(db!, 'platform', 'config'),
    (snapshot) => {
      callback(mapPlatformSettings(snapshot.exists() ? snapshot.data() : undefined));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'platform settings'));
    }
  );
}

export function subscribeToPlatformUpdates(
  callback: (updates: PlatformUpdate[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'platformUpdates'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapPlatformUpdate(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'platform updates'));
    },
  );
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: UserNotification[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'userNotifications'), where('userId', '==', userId)),
    (snapshot) => {
      const notifications = snapshot.docs
        .map((docSnapshot) => mapUserNotification(docSnapshot.id, docSnapshot.data()))
        .sort((firstNotification, secondNotification) => secondNotification.createdAt.getTime() - firstNotification.createdAt.getTime());
      callback(notifications);
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'user notifications'));
    },
  );
}

export function subscribeToCourseRequests(
  callback: (requests: CourseRequest[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'courseRequests'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapCourseRequest(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'course requests'));
    },
  );
}

export function subscribeToCourseRequestInterests(
  callback: (interests: CourseRequestInterest[]) => void,
  onError?: (message: string) => void
): Unsubscribe {
  assertConfigured();
  return onSnapshot(
    query(collection(db!, 'courseRequestInterests'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      callback(snapshot.docs.map((docSnapshot) => mapCourseRequestInterest(docSnapshot.id, docSnapshot.data())));
    },
    (error) => {
      onError?.(getSnapshotErrorMessage(error, 'course request interests'));
    },
  );
}

export async function getPlatformSettingsRecord() {
  assertConfigured();
  const snapshot = await getDoc(doc(db!, 'platform', 'config'));
  return mapPlatformSettings(snapshot.exists() ? snapshot.data() : undefined);
}

export async function loginWithEmail(email: string, password: string) {
  assertConfigured();
  const credentials = await signInWithEmailAndPassword(auth!, email, password);
  const refreshedUser = await refreshAuthUser(credentials.user);
  const userId = (refreshedUser || credentials.user).uid;
  const profile = await getCurrentUserProfile(userId);
  if (!profile) {
    throw new Error('Your user profile could not be found.');
  }
  if (profile.accountStatus === 'suspended') {
    await signOut(auth!);
    throw new Error('This account has been suspended by the administrator.');
  }
  if (profile.accountStatus === 'deleted') {
    await signOut(auth!);
    throw new Error('This account has been removed from the platform by the administrator.');
  }
  await updateDoc(doc(db!, 'users', userId), {
    signInCount: profile.signInCount + 1,
  });
  const updatedProfile = await getCurrentUserProfile(userId);
  if (!updatedProfile) {
    throw new Error('Your user profile could not be found.');
  }
  return updatedProfile;
}

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  assertConfigured();
  const platformSettings = await getPlatformSettingsRecord();
  if (!platformSettings.allowNewSignups) {
    throw new Error('New account creation is temporarily disabled by the administrator.');
  }
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
    emailVerified: auth?.currentUser?.emailVerified ?? currentUser.emailVerified,
  };
}

export async function switchUserRoleRecord(user: User, role: UserRole) {
  assertConfigured();

  if (isAdminEmail(user.email)) {
    throw new Error('The configured admin account cannot switch into tutor or learner mode.');
  }

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
      bio: user.bio || 'Oops! This Tutor forgot to craft a bio.',
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

  if (isAdminEmail(user.email)) {
    throw new Error('The configured admin account cannot be listed as a tutor.');
  }

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
  const platformSettings = await getPlatformSettingsRecord();

  if (!platformSettings.allowBookings) {
    throw new Error('Booking requests are temporarily disabled by the administrator.');
  }

  if (!platformSettings.allowTutorBrowsing) {
    throw new Error('Tutor browsing is temporarily disabled by the administrator.');
  }

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

  if (isAdminEmail(auth?.currentUser?.email) || isAdminEmail(tutorProfile.email)) {
    throw new Error('The admin account cannot book or receive tutoring sessions.');
  }

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

export async function updatePlatformSettingsRecord(settings: PlatformSettings) {
  assertConfigured();

  const payload: PlatformSettings = {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...settings,
    adminEmail: normalizeEmail(settings.adminEmail || ADMIN_EMAIL),
  };

  await setDoc(doc(db!, 'platform', 'config'), payload, { merge: true });
  return payload;
}

export async function updateUserAccountStatusRecord(user: User, status: AccountStatus) {
  assertConfigured();

  if (!isAdminEmail(auth?.currentUser?.email)) {
    throw new Error('Only the configured admin can manage user access.');
  }

  if (isAdminEmail(user.email)) {
    throw new Error('The configured admin account cannot be suspended or deleted.');
  }

  await updateDoc(doc(db!, 'users', user.id), { accountStatus: status });

  const tutorProfileRef = doc(db!, 'tutorProfiles', user.id);
  const tutorProfileSnapshot = await getDoc(tutorProfileRef);
  if (tutorProfileSnapshot.exists()) {
    await updateDoc(tutorProfileRef, { isAvailable: false });
  }

  return {
    ...user,
    accountStatus: status,
  };
}

export async function sendPasswordResetLinkRecord(email: string) {
  assertConfigured();
  await sendPasswordResetEmail(auth!, email.trim());
}

export async function sendEmailVerificationLinkRecord() {
  assertConfigured();

  const currentAuthUser = await refreshAuthUser(auth?.currentUser ?? null);
  if (!currentAuthUser) {
    throw new Error('You need to be signed in.');
  }

  if (currentAuthUser.emailVerified) {
    return 'already-verified' as const;
  }

  await sendEmailVerification(currentAuthUser);
  return 'sent' as const;
}

export async function createUserNotificationRecord(userId: string, title: string, message: string) {
  assertConfigured();

  const currentEmail = normalizeEmail(auth?.currentUser?.email);
  if (!isAdminEmail(currentEmail)) {
    throw new Error('Only the configured admin can send user notifications.');
  }

  const payload = {
    userId,
    title: title.trim(),
    message: message.trim(),
    createdByEmail: currentEmail,
    createdAt: serverTimestamp(),
    active: true,
    readAt: null,
    clearedAt: null,
  };

  const docRef = await addDoc(collection(db!, 'userNotifications'), payload);
  const created = await getDoc(docRef);
  return mapUserNotification(created.id, created.data() || payload);
}

export async function createCourseRequestRecord(
  requester: User,
  request: {
    courseCode: string;
    courseName: string;
    details: string;
  }
) {
  assertConfigured();

  if (isAdminEmail(requester.email)) {
    throw new Error('The admin account cannot create course requests.');
  }

  const payload = {
    requesterUserId: requester.id,
    requesterRole: requester.role,
    courseCode: request.courseCode.trim().toUpperCase(),
    courseName: request.courseName.trim(),
    details: request.details.trim(),
    status: 'open' as const,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, 'courseRequests'), payload);
  const created = await getDoc(docRef);
  return mapCourseRequest(created.id, created.data() || payload);
}

export async function toggleCourseRequestInterestRecord(requestId: string, tutor: User) {
  assertConfigured();

  if (tutor.role !== 'tutor') {
    throw new Error('Only tutors can indicate interest in a course request.');
  }

  if (isAdminEmail(tutor.email)) {
    throw new Error('The admin account cannot indicate interest in course requests.');
  }

  const requestRef = doc(db!, 'courseRequests', requestId);
  const requestSnapshot = await getDoc(requestRef);

  if (!requestSnapshot.exists()) {
    throw new Error('This course request could not be found.');
  }

  const request = mapCourseRequest(requestSnapshot.id, requestSnapshot.data());
  if (request.status !== 'open') {
    throw new Error('This course request is no longer open.');
  }

  if (request.requesterUserId === tutor.id) {
    throw new Error('You cannot indicate interest in your own request.');
  }

  const interestRef = doc(db!, 'courseRequestInterests', getCourseRequestInterestId(requestId, tutor.id));
  const interestSnapshot = await getDoc(interestRef);

  if (interestSnapshot.exists()) {
    await deleteDoc(interestRef);
    return false;
  }

  await setDoc(interestRef, {
    requestId,
    tutorUserId: tutor.id,
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function markUserNotificationsAsReadRecord(userId: string, notificationIds: string[]) {
  assertConfigured();

  if (notificationIds.length === 0) {
    return;
  }

  const currentUserId = auth?.currentUser?.uid ?? null;
  const currentEmail = normalizeEmail(auth?.currentUser?.email);

  if (currentUserId !== userId && !isAdminEmail(currentEmail)) {
    throw new Error('You can only update your own notifications.');
  }

  const notificationIdSet = new Set(notificationIds);
  const snapshot = await getDocs(query(collection(db!, 'userNotifications'), where('userId', '==', userId)));
  const batch = writeBatch(db!);
  let pendingUpdates = 0;

  snapshot.docs.forEach((docSnapshot) => {
    if (!notificationIdSet.has(docSnapshot.id)) {
      return;
    }

    const notification = mapUserNotification(docSnapshot.id, docSnapshot.data());
    if (!notification.active || notification.readAt) {
      return;
    }

    batch.update(docSnapshot.ref, {
      readAt: serverTimestamp(),
    });
    pendingUpdates += 1;
  });

  if (pendingUpdates > 0) {
    await batch.commit();
  }
}

export async function clearUserNotificationsRecord(userId: string, notificationIds: string[]) {
  assertConfigured();

  if (notificationIds.length === 0) {
    return;
  }

  const currentUserId = auth?.currentUser?.uid ?? null;
  const currentEmail = normalizeEmail(auth?.currentUser?.email);

  if (currentUserId !== userId && !isAdminEmail(currentEmail)) {
    throw new Error('You can only clear your own notifications.');
  }

  const notificationIdSet = new Set(notificationIds);
  const snapshot = await getDocs(query(collection(db!, 'userNotifications'), where('userId', '==', userId)));
  const batch = writeBatch(db!);
  let pendingUpdates = 0;

  snapshot.docs.forEach((docSnapshot) => {
    if (!notificationIdSet.has(docSnapshot.id)) {
      return;
    }

    const notification = mapUserNotification(docSnapshot.id, docSnapshot.data());
    if (!notification.active) {
      return;
    }

    batch.update(docSnapshot.ref, {
      active: false,
      readAt: notification.readAt ?? serverTimestamp(),
      clearedAt: serverTimestamp(),
    });
    pendingUpdates += 1;
  });

  if (pendingUpdates > 0) {
    await batch.commit();
  }
}

export async function createPlatformUpdateRecord(update: {
  title: string;
  message: string;
  category: PlatformUpdate['category'];
  audience: PlatformUpdate['audience'];
}) {
  assertConfigured();

  const currentEmail = normalizeEmail(auth?.currentUser?.email);
  if (!isAdminEmail(currentEmail)) {
    throw new Error('Only the configured admin can post platform updates.');
  }

  const payload = {
    title: update.title.trim(),
    message: update.message.trim(),
    category: update.category,
    audience: update.audience,
    active: true,
    createdByEmail: currentEmail,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, 'platformUpdates'), payload);
  const created = await getDoc(docRef);
  return mapPlatformUpdate(created.id, created.data() || payload);
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
