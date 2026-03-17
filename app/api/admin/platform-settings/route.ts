import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PLATFORM_SETTINGS, normalizeEmail, type PlatformSettings } from '@/lib/platform';
import { ensurePlatformSettings, jsonError, requireAdminRequest } from '@/lib/server/admin-api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminRequest = await requireAdminRequest(request);
  if ('error' in adminRequest) return adminRequest.error;

  try {
    const body = (await request.json()) as Partial<PlatformSettings>;
    const currentSettings = await ensurePlatformSettings(adminRequest.adminEmail);

    const nextSettings: PlatformSettings = {
      ...DEFAULT_PLATFORM_SETTINGS,
      ...currentSettings,
      ...body,
      adminEmail: normalizeEmail(adminRequest.adminEmail),
    };

    await adminRequest.db.collection('platform').doc('config').set(nextSettings, { merge: true });

    return NextResponse.json({ settings: nextSettings });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save platform settings.', 500);
  }
}
