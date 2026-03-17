import type { User } from '@/lib/types';

export type PlatformSettings = {
  adminEmail: string;
  allowNewSignups: boolean;
  allowTutorBrowsing: boolean;
  allowBookings: boolean;
  allowResources: boolean;
  showBrowseTutorsNav: boolean;
  showAboutNav: boolean;
  showHowItWorksNav: boolean;
  showContactNav: boolean;
  showResourcesNav: boolean;
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  adminEmail: '',
  allowNewSignups: true,
  allowTutorBrowsing: true,
  allowBookings: true,
  allowResources: true,
  showBrowseTutorsNav: true,
  showAboutNav: true,
  showHowItWorksNav: true,
  showContactNav: true,
  showResourcesNav: false,
};

export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

export function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  if (!ADMIN_EMAIL) return false;
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export function isAdminUser(user: User | null) {
  return Boolean(user && isAdminEmail(user.email));
}
