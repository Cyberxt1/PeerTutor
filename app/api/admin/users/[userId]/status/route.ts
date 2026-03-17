import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/platform';
import { jsonError, requireAdminRequest, serializeUser } from '@/lib/server/admin-api';
import type { AccountStatus } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const { userId } = await context.params;
    const body = (await request.json()) as { status?: AccountStatus };
    const status = body.status;

    if (status !== 'active' && status !== 'suspended' && status !== 'deleted') {
      return jsonError('Choose a valid account status.', 400);
    }

    const userRef = adminRequest.db.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return jsonError('User not found.', 404);
    }

    const userData = userSnapshot.data() || {};
    if (normalizeEmail(userData.email as string | undefined) === adminRequest.adminEmail) {
      return jsonError('The configured admin account cannot be suspended or deleted.', 400);
    }

    await userRef.set({ accountStatus: status }, { merge: true });

    const tutorProfileRef = adminRequest.db.collection('tutorProfiles').doc(userId);
    const tutorProfileSnapshot = await tutorProfileRef.get();
    if (tutorProfileSnapshot.exists) {
      await tutorProfileRef.set({ isAvailable: status === 'active' ? tutorProfileSnapshot.data()?.isAvailable ?? false : false }, { merge: true });
    }

    const updatedSnapshot = await userRef.get();
    return NextResponse.json({ user: serializeUser(updatedSnapshot.id, updatedSnapshot.data() || {}) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update this user.', 500);
  }
}
