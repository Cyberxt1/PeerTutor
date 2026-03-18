import { NextRequest, NextResponse } from 'next/server';
import { getServerTimestamp, jsonError, requireAdminRequest } from '@/lib/server/admin-api';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const { userId } = await context.params;
    const body = (await request.json()) as { title?: string; message?: string };
    const title = body.title?.trim();
    const message = body.message?.trim();

    if (!title || !message) {
      return jsonError('Add both a notification title and message before sending.', 400);
    }

    await adminRequest.db.collection('userNotifications').add({
      userId,
      title,
      message,
      createdByEmail: adminRequest.adminEmail,
      createdAt: getServerTimestamp(),
      active: true,
      readAt: null,
      clearedAt: null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to send this notification.', 500);
  }
}
