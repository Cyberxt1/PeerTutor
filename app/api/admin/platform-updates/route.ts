import { NextRequest, NextResponse } from 'next/server';
import { jsonError, requireAdminRequest, serializePlatformUpdate, getServerTimestamp } from '@/lib/server/admin-api';
import type { PlatformUpdate } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const body = (await request.json()) as Pick<PlatformUpdate, 'title' | 'message' | 'category' | 'audience'>;
    const title = body.title?.trim();
    const message = body.message?.trim();

    if (!title || !message) {
      return jsonError('Add both a title and message before posting an update.', 400);
    }

    const payload = {
      title,
      message,
      category: body.category || 'announcement',
      audience: body.audience || 'all',
      active: true,
      createdByEmail: adminRequest.adminEmail,
      createdAt: getServerTimestamp(),
    };

    const docRef = await adminRequest.db.collection('platformUpdates').add(payload);
    const created = await docRef.get();

    return NextResponse.json({ update: serializePlatformUpdate(created.id, created.data() || payload) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to post the platform update.', 500);
  }
}
