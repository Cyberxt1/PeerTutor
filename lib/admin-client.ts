'use client';

import { auth } from '@/lib/firebase/client';
import type { PlatformSettings } from '@/lib/platform';
import type { AccountStatus, PlatformUpdate } from '@/lib/types';

export type AdminDashboardUser = {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'tutor';
  accountStatus: AccountStatus;
  profileImage?: string;
  bio?: string;
  phone?: string;
  createdAt: string;
};

export type AdminDashboardTutorProfile = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio: string;
  subjects: string[];
  courses: Array<{ id: string; code: string; name: string }>;
  hourlyRate: number;
  isAvailable: boolean;
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
};

export type AdminDashboardBooking = {
  id: string;
  studentId: string;
  tutorId: string;
  tutorUserId: string;
  participantIds: string[];
  subjectId: string;
  sessionDate: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
};

export type AdminDashboardReview = {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type AdminDashboardPlatformUpdate = Omit<PlatformUpdate, 'createdAt'> & {
  createdAt: string;
};

export type AdminDashboardPayload = {
  platformSettings: PlatformSettings;
  users: AdminDashboardUser[];
  tutorProfiles: AdminDashboardTutorProfile[];
  bookings: AdminDashboardBooking[];
  reviews: AdminDashboardReview[];
  platformUpdates: AdminDashboardPlatformUpdate[];
};

async function getAdminHeaders() {
  if (!auth) {
    throw new Error('Firebase is not configured yet.');
  }

  if (!auth.currentUser) {
    await auth.authStateReady();
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('You need to be signed in.');
  }

  const token = await user.getIdToken(true);
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(await getAdminHeaders()),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => null)) as { error?: string } & T | null;

  if (!response.ok) {
    throw new Error(data?.error || 'Admin request failed.');
  }

  return data as T;
}

export async function fetchAdminDashboard() {
  return adminRequest<AdminDashboardPayload>('/api/admin/dashboard', {
    method: 'GET',
  });
}

export async function saveAdminPlatformSettings(settings: Partial<PlatformSettings>) {
  const response = await adminRequest<{ settings: PlatformSettings }>('/api/admin/platform-settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return response.settings;
}

export async function postAdminPlatformUpdate(update: {
  title: string;
  message: string;
  category: PlatformUpdate['category'];
  audience: PlatformUpdate['audience'];
}) {
  const response = await adminRequest<{ update: AdminDashboardPlatformUpdate }>('/api/admin/platform-updates', {
    method: 'POST',
    body: JSON.stringify(update),
  });
  return response.update;
}

export async function updateAdminUserStatus(userId: string, status: AccountStatus) {
  const response = await adminRequest<{ user: AdminDashboardUser }>(`/api/admin/users/${userId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  return response.user;
}

export async function sendAdminUserNotification(userId: string, title: string, message: string) {
  await adminRequest<{ ok: true }>(`/api/admin/users/${userId}/notification`, {
    method: 'POST',
    body: JSON.stringify({ title, message }),
  });
}

export async function sendAdminPasswordReset(email: string) {
  await adminRequest<{ ok: true }>('/api/admin/password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
