'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/header';
import { useApp } from '@/lib/context';

export default function EarningsPage() {
  const { currentUser, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!currentUser) {
      router.replace('/auth/login');
      return;
    }

    if (currentUser.role !== 'tutor') {
      router.replace('/student/dashboard');
      return;
    }

    router.replace('/tutor/dashboard?tab=earnings');
  }, [currentUser, isLoading, router]);

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">
            {isLoading ? 'Checking your account...' : 'Opening earnings...'}
          </p>
        </div>
      </main>
    </>
  );
}
