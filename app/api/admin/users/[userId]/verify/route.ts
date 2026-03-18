import { NextRequest, NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/platform';
import { jsonError, requireAdminRequest, serializeUser } from '@/lib/server/admin-api';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const { userId } = await context.params;
    const userRef = adminRequest.db.collection('users').doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return jsonError('User not found.', 404);
    }

    const userData = userSnapshot.data() || {};
    if (normalizeEmail(userData.email as string | undefined) === adminRequest.adminEmail) {
      return jsonError('The configured admin account does not need manual verification.', 400);
    }

    await adminRequest.adminAuth.updateUser(userId, {
      emailVerified: true,
    });

    const updates: Record<string, unknown> = {
      emailVerified: true,
      verificationSuspended: false,
    };

    if (userData.verificationSuspended === true) {
      updates.accountStatus = 'active';
    }

    await userRef.set(updates, { merge: true });

    const updatedSnapshot = await userRef.get();
    const authUser = await adminRequest.adminAuth.getUser(userId);
    return NextResponse.json({
      user: serializeUser(updatedSnapshot.id, updatedSnapshot.data() || {}, authUser),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to verify this user.', 500);
  }
}
