'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { defaultSubjects } from '@/lib/catalog';
import { DEFAULT_PLATFORM_SETTINGS, isAdminUser, type PlatformSettings } from '@/lib/platform';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import {
  createBookingRecord,
  createPlatformUpdateRecord,
  createReviewRecord,
  createUserNotificationRecord,
  buildTutorRecords,
  getCurrentUserProfile,
  loginWithEmail,
  logoutUser,
  sendPasswordResetLinkRecord,
  signupWithEmail,
  subscribeToAuth,
  subscribeToAllBookings,
  subscribeToBookings,
  subscribeToPlatformUpdates,
  subscribeToPlatformSettings,
  subscribeToReviews,
  subscribeToTutorProfiles,
  subscribeToUserNotifications,
  subscribeToUsers,
  switchUserRoleRecord,
  type StoredTutorProfile,
  updateBookingStatusRecord,
  updatePlatformSettingsRecord,
  updateUserAccountStatusRecord,
  updateTutorProfileRecord,
  updateUserProfileRecord,
} from '@/lib/firebase/service';
import {
  getAllTutorCourses,
  getBookingsForUser,
  getCourseLabel,
  getTutorById,
  getTutorByUserId,
  getTutorCourseOptions,
  getUserById,
  getReviewsForTutor,
} from '@/lib/app-data';
import type {
  AvailabilitySlot,
  Booking,
  PlatformUpdate,
  Review,
  Subject,
  TutorCourse,
  TutorRecord,
  User,
  UserNotification,
  UserRole,
} from '@/lib/types';

interface AppContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isFirebaseConfigured: boolean;
  platformSettings: PlatformSettings;
  subjects: Subject[];
  users: User[];
  tutors: TutorRecord[];
  bookings: Booking[];
  reviews: Review[];
  platformUpdates: PlatformUpdate[];
  userNotifications: UserNotification[];
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (
    updates: Partial<Pick<User, 'name' | 'email' | 'phone' | 'bio' | 'profileImage'>>
  ) => Promise<User>;
  switchUserRole: (role: UserRole) => Promise<User>;
  updateTutorProfile: (updates: {
    bio?: string;
    hourlyRate?: number;
    subjects?: string[];
    courses?: TutorCourse[];
    availability?: AvailabilitySlot[];
    isAvailable?: boolean;
  }) => Promise<void>;
  createBooking: (
    tutorId: string,
    subjectId: string,
    sessionDate: Date,
    duration: number,
    notes?: string
  ) => Promise<Booking>;
  confirmBooking: (bookingId: string) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<Booking>;
  completeBooking: (bookingId: string) => Promise<Booking>;
  createReview: (bookingId: string, tutorId: string, rating: number, comment: string) => Promise<Review>;
  createPlatformUpdate: (update: {
    title: string;
    message: string;
    category: PlatformUpdate['category'];
    audience: PlatformUpdate['audience'];
  }) => Promise<PlatformUpdate>;
  updateUserAccountStatus: (user: User, status: 'active' | 'suspended' | 'deleted') => Promise<User>;
  sendUserNotification: (userId: string, title: string, message: string) => Promise<UserNotification>;
  updatePlatformSettings: (settings: Partial<PlatformSettings>) => Promise<PlatformSettings>;
  sendPasswordResetLink: (email: string) => Promise<void>;
  getTutorById: (tutorId: string) => TutorRecord | undefined;
  getTutorByUserId: (userId: string) => TutorRecord | undefined;
  getTutorCourseOptions: (tutorId: string) => Array<{ id: string; code: string; name: string; label: string }>;
  getAllTutorCourses: () => Array<{ id: string; code: string; name: string; label: string }>;
  getCourseLabel: (tutorId: string, courseId: string) => string;
  getBookings: (userId: string, role: UserRole) => Booking[];
  getReviews: (tutorId: string) => Review[];
  getUserById: (userId: string) => User | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getReadableFirebaseError(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (error.code === 'auth/email-already-in-use') return 'Email already registered.';
    if (error.code === 'auth/requires-recent-login') {
      return 'For security, please log out and sign in again before changing your email.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [users, setUsers] = useState<User[]>([]);
  const [tutorProfiles, setTutorProfiles] = useState<StoredTutorProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [platformUpdates, setPlatformUpdates] = useState<PlatformUpdate[]>([]);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setUsers([]);
        setBookings([]);
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUserProfile(firebaseUser.uid);
        setCurrentUser(profile);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToTutorProfiles(setTutorProfiles);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToReviews(setReviews);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return subscribeToPlatformUpdates(setPlatformUpdates);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
      return undefined;
    }

    return subscribeToPlatformSettings(setPlatformSettings);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return undefined;
    return subscribeToUsers(setUsers);
  }, [currentUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return undefined;
    if (isAdminUser(currentUser)) {
      return subscribeToAllBookings(setBookings);
    }
    return subscribeToBookings(currentUser.id, setBookings);
  }, [currentUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser || isAdminUser(currentUser)) {
      setUserNotifications([]);
      return undefined;
    }

    return subscribeToUserNotifications(currentUser.id, setUserNotifications);
  }, [currentUser]);

  const isAdmin = useMemo(() => isAdminUser(currentUser), [currentUser]);
  const visibleUsers = useMemo(
    () => (isAdmin ? users : users.filter((user) => !isAdminUser(user))),
    [isAdmin, users]
  );
  const visibleTutorProfiles = useMemo(
    () =>
      tutorProfiles.filter(
        (profile) =>
          !isAdminUser({
            id: profile.userId,
            name: profile.displayName,
            email: profile.email,
            role: 'tutor',
            createdAt: profile.createdAt,
          })
      ),
    [tutorProfiles]
  );
  const tutors = useMemo(
    () => buildTutorRecords(visibleTutorProfiles, visibleUsers, reviews),
    [reviews, visibleTutorProfiles, visibleUsers]
  );

  const contextValue = useMemo<AppContextType>(() => {
    return {
      currentUser,
      isAdmin,
      isLoading,
      isFirebaseConfigured,
      platformSettings,
      subjects: defaultSubjects,
      users: visibleUsers,
      tutors,
      bookings,
      reviews,
      platformUpdates,
      userNotifications,
      async login(email, password) {
        try {
          const user = await loginWithEmail(email, password);
          setCurrentUser(user);
          return user;
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async signup(name, email, password, role) {
        try {
          const user = await signupWithEmail(name, email, password, role);
          setCurrentUser(user);
          return user;
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async logout() {
        try {
          await logoutUser();
          setCurrentUser(null);
          setBookings([]);
          setUsers([]);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async refreshUser() {
        if (!currentUser) return;

        try {
          const refreshed = await getCurrentUserProfile(currentUser.id);
          if (refreshed) {
            setCurrentUser(refreshed);
          }
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async updateUserProfile(updates) {
        if (!currentUser) {
          throw new Error('You need to be signed in.');
        }

        try {
          const updated = await updateUserProfileRecord(currentUser.id, currentUser, updates);
          setCurrentUser(updated);
          return updated;
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async switchUserRole(role) {
        if (!currentUser) {
          throw new Error('You need to be signed in.');
        }

        try {
          const updated = await switchUserRoleRecord(currentUser, role);
          setCurrentUser(updated);
          return updated;
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async updateTutorProfile(updates) {
        if (!currentUser) {
          throw new Error('You need to be signed in.');
        }

        try {
          await updateTutorProfileRecord(currentUser, updates);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async createBooking(tutorId, subjectId, sessionDate, duration, notes) {
        if (!currentUser) {
          throw new Error('You need to be signed in.');
        }

        try {
          return await createBookingRecord(currentUser.id, tutorId, subjectId, sessionDate, duration, notes);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async confirmBooking(bookingId) {
        try {
          return await updateBookingStatusRecord(bookingId, 'confirmed');
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async cancelBooking(bookingId) {
        try {
          return await updateBookingStatusRecord(bookingId, 'cancelled');
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async completeBooking(bookingId) {
        try {
          return await updateBookingStatusRecord(bookingId, 'completed');
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async createReview(bookingId, tutorId, rating, comment) {
        if (!currentUser) {
          throw new Error('You need to be signed in.');
        }

        try {
          return await createReviewRecord(bookingId, currentUser.id, tutorId, rating, comment);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async createPlatformUpdate(update) {
        if (!currentUser || !isAdminUser(currentUser)) {
          throw new Error('Only the configured admin can post platform updates.');
        }

        try {
          return await createPlatformUpdateRecord(update);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async updateUserAccountStatus(user, status) {
        if (!currentUser || !isAdminUser(currentUser)) {
          throw new Error('Only the configured admin can manage user access.');
        }

        try {
          return await updateUserAccountStatusRecord(user, status);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async sendUserNotification(userId, title, message) {
        if (!currentUser || !isAdminUser(currentUser)) {
          throw new Error('Only the configured admin can send user notifications.');
        }

        try {
          return await createUserNotificationRecord(userId, title, message);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async updatePlatformSettings(settings) {
        if (!currentUser || !isAdminUser(currentUser)) {
          throw new Error('Only the configured admin can update platform settings.');
        }

        try {
          const nextSettings = await updatePlatformSettingsRecord({
            ...platformSettings,
            ...settings,
          });
          setPlatformSettings(nextSettings);
          return nextSettings;
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      async sendPasswordResetLink(email) {
        if (!currentUser || !isAdminUser(currentUser)) {
          throw new Error('Only the configured admin can send password reset links.');
        }

        try {
          await sendPasswordResetLinkRecord(email);
        } catch (error) {
          throw new Error(getReadableFirebaseError(error));
        }
      },
      getTutorById(tutorId) {
        return getTutorById(tutors, tutorId);
      },
      getTutorByUserId(userId) {
        return getTutorByUserId(tutors, userId);
      },
      getTutorCourseOptions(tutorId) {
        return getTutorCourseOptions(getTutorById(tutors, tutorId), defaultSubjects);
      },
      getAllTutorCourses() {
        return getAllTutorCourses(tutors, defaultSubjects);
      },
      getCourseLabel(tutorId, courseId) {
        return getCourseLabel(tutors, defaultSubjects, tutorId, courseId);
      },
      getBookings(userId, role) {
        return getBookingsForUser(bookings, userId, role);
      },
      getReviews(tutorId) {
        return getReviewsForTutor(reviews, tutorId);
      },
      getUserById(userId) {
        return getUserById(visibleUsers, userId);
      },
    };
  }, [bookings, currentUser, isAdmin, isLoading, platformSettings, platformUpdates, reviews, tutors, userNotifications, users, visibleUsers]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
