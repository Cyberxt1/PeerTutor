import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ADMIN_EMAIL, DEFAULT_PLATFORM_SETTINGS, normalizeEmail, type PlatformSettings } from '@/lib/platform';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@/lib/firebase/admin';

function getAuthToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;
  return authorization.slice('Bearer '.length).trim();
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireAdminRequest(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    return { error: jsonError('You need to be signed in.', 401) };
  }

  if (!ADMIN_EMAIL) {
    return { error: jsonError('The admin email is not configured on the server.', 500) };
  }

  let adminAuth;
  let db;

  try {
    adminAuth = getFirebaseAdminAuth();
    db = getFirebaseAdminDb();
  } catch (error) {
    return {
      error: jsonError(
        error instanceof Error ? error.message : 'Firebase Admin is not configured on the server.',
        500
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const decodedEmail = normalizeEmail(decodedToken.email);

    if (!decodedToken.email_verified) {
      return { error: jsonError('Verify the admin email address before continuing.', 403) };
    }

    if (decodedEmail !== normalizeEmail(ADMIN_EMAIL)) {
      return { error: jsonError('Admin access denied.', 403) };
    }

    return {
      adminEmail: decodedEmail,
      adminUid: decodedToken.uid,
      adminAuth,
      db,
    };
  } catch (error) {
    return {
      error: jsonError(
        error instanceof Error ? `Admin session verification failed: ${error.message}` : 'Your session expired. Sign in again and retry.',
        401
      ),
    };
  }
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const dateValue = value.toDate();
    if (dateValue instanceof Date) return dateValue.toISOString();
  }

  const fallbackDate = new Date();
  return fallbackDate.toISOString();
}

function parsePlatformSettings(
  data: Record<string, unknown> | undefined,
  adminEmail: string
): PlatformSettings {
  return {
    adminEmail: normalizeEmail(adminEmail),
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

export async function ensurePlatformSettings(adminEmail: string) {
  const db = getFirebaseAdminDb();
  const configRef = db.collection('platform').doc('config');
  const snapshot = await configRef.get();
  const settings = parsePlatformSettings(
    snapshot.exists ? (snapshot.data() as Record<string, unknown>) : undefined,
    adminEmail
  );

  if (!snapshot.exists || normalizeEmail(snapshot.data()?.adminEmail as string | undefined) !== settings.adminEmail) {
    await configRef.set(settings, { merge: true });
  }

  return settings;
}

export function serializeUser(
  id: string,
  data: Record<string, unknown>,
  authUser?: { emailVerified?: boolean | null }
) {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'CampusTutor User',
    email: typeof data.email === 'string' ? data.email : '',
    emailVerified:
      typeof authUser?.emailVerified === 'boolean'
        ? authUser.emailVerified
        : typeof data.emailVerified === 'boolean'
          ? data.emailVerified
          : false,
    role: data.role === 'tutor' ? 'tutor' : 'student',
    verificationSuspended: Boolean(data.verificationSuspended),
    accountStatus:
      data.accountStatus === 'suspended' || data.accountStatus === 'deleted'
        ? data.accountStatus
        : 'active',
    profileImage: typeof data.profileImage === 'string' ? data.profileImage : '',
    bio: typeof data.bio === 'string' ? data.bio : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export function serializeTutorProfile(id: string, data: Record<string, unknown>) {
  return {
    id,
    userId: typeof data.userId === 'string' ? data.userId : id,
    displayName: typeof data.displayName === 'string' ? data.displayName : 'CampusTutor Tutor',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    profileImage: typeof data.profileImage === 'string' ? data.profileImage : '',
    bio: typeof data.bio === 'string' ? data.bio : '',
    subjects: Array.isArray(data.subjects) ? data.subjects.filter((item): item is string => typeof item === 'string') : [],
    courses: Array.isArray(data.courses) ? data.courses : [],
    hourlyRate: typeof data.hourlyRate === 'number' ? data.hourlyRate : 2000,
    isAvailable: Boolean(data.isAvailable),
    availability: Array.isArray(data.availability) ? data.availability : [],
    verificationStatus:
      data.verificationStatus === 'verified' || data.verificationStatus === 'rejected'
        ? data.verificationStatus
        : 'pending',
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export function serializeBooking(id: string, data: Record<string, unknown>) {
  return {
    id,
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    tutorId: typeof data.tutorId === 'string' ? data.tutorId : '',
    tutorUserId: typeof data.tutorUserId === 'string' ? data.tutorUserId : '',
    participantIds: Array.isArray(data.participantIds)
      ? data.participantIds.filter((item): item is string => typeof item === 'string')
      : [],
    subjectId: typeof data.subjectId === 'string' ? data.subjectId : '',
    sessionDate: serializeTimestamp(data.sessionDate),
    duration: typeof data.duration === 'number' ? data.duration : 60,
    status:
      data.status === 'confirmed' || data.status === 'completed' || data.status === 'cancelled'
        ? data.status
        : 'pending',
    notes: typeof data.notes === 'string' ? data.notes : '',
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export function serializeReview(id: string, data: Record<string, unknown>) {
  return {
    id,
    bookingId: typeof data.bookingId === 'string' ? data.bookingId : '',
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    tutorId: typeof data.tutorId === 'string' ? data.tutorId : '',
    rating: typeof data.rating === 'number' ? data.rating : 0,
    comment: typeof data.comment === 'string' ? data.comment : '',
    createdAt: serializeTimestamp(data.createdAt),
  };
}

export function serializePlatformUpdate(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Platform update',
    message: typeof data.message === 'string' ? data.message : '',
    category:
      data.category === 'coming-soon' || data.category === 'maintenance' || data.category === 'feature'
        ? data.category
        : 'announcement',
    audience: data.audience === 'students' || data.audience === 'tutors' ? data.audience : 'all',
    createdAt: serializeTimestamp(data.createdAt),
    createdByEmail: typeof data.createdByEmail === 'string' ? data.createdByEmail : '',
    active: typeof data.active === 'boolean' ? data.active : true,
  };
}

export function getServerTimestamp() {
  return FieldValue.serverTimestamp();
}
