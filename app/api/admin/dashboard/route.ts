import { NextRequest, NextResponse } from 'next/server';
import {
  ensurePlatformSettings,
  jsonError,
  requireAdminRequest,
  serializeBooking,
  serializePlatformUpdate,
  serializeReview,
  serializeTutorProfile,
  serializeUser,
} from '@/lib/server/admin-api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const { db, adminEmail } = adminRequest;
    const platformSettings = await ensurePlatformSettings(adminEmail);

    const [usersSnapshot, tutorProfilesSnapshot, bookingsSnapshot, reviewsSnapshot, updatesSnapshot] =
      await Promise.all([
        db.collection('users').orderBy('createdAt', 'desc').get(),
        db.collection('tutorProfiles').orderBy('createdAt', 'desc').get(),
        db.collection('bookings').orderBy('createdAt', 'desc').get(),
        db.collection('reviews').orderBy('createdAt', 'desc').get(),
        db.collection('platformUpdates').orderBy('createdAt', 'desc').get(),
      ]);

    return NextResponse.json({
      platformSettings,
      users: usersSnapshot.docs.map((doc) => serializeUser(doc.id, doc.data())),
      tutorProfiles: tutorProfilesSnapshot.docs.map((doc) => serializeTutorProfile(doc.id, doc.data())),
      bookings: bookingsSnapshot.docs.map((doc) => serializeBooking(doc.id, doc.data())),
      reviews: reviewsSnapshot.docs.map((doc) => serializeReview(doc.id, doc.data())),
      platformUpdates: updatesSnapshot.docs.map((doc) => serializePlatformUpdate(doc.id, doc.data())),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load admin dashboard data.', 500);
  }
}
