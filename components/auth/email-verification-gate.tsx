'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { isAdminUser } from '@/lib/platform';

export default function EmailVerificationGate() {
  const { currentUser, isLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !currentUser || isAdminUser(currentUser) || currentUser.emailVerified) {
      return;
    }

    if (pathname === '/auth/verify-email') {
      return;
    }

    router.replace('/auth/verify-email');
  }, [currentUser, isLoading, pathname, router]);

  return null;
}
