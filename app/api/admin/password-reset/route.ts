import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireAdminRequest } from '@/lib/server/admin-api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim();
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const resetUrl = `${request.nextUrl.origin}/auth/reset-password`;

    if (!email) {
      return jsonError('Enter a student email address first.', 400);
    }

    if (!apiKey) {
      return jsonError('Firebase API key is missing on the server.', 500);
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
          continueUrl: resetUrl,
          canHandleCodeInApp: true,
        }),
      }
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
      const message = data?.error?.message || 'Unable to send the password reset email.';
      return jsonError(message, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to send the password reset email.', 500);
  }
}
