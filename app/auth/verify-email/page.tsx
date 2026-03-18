'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useApp } from '@/lib/context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isAdminUser } from '@/lib/platform';

export default function VerifyEmailPage() {
  const {
    currentUser,
    isLoading,
    sendEmailVerificationLink,
    refreshUser,
    logout,
  } = useApp();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !currentUser) {
      return;
    }

    if (isAdminUser(currentUser)) {
      router.replace('/addmean');
      return;
    }

    if (currentUser.emailVerified) {
      router.replace(currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard');
    }
  }, [currentUser, isLoading, router]);

  const handleSendVerification = async () => {
    setSending(true);
    setMessage('');

    try {
      const result = await sendEmailVerificationLink();
      setMessageType('success');
      setMessage(
        result === 'already-verified'
          ? 'Your email address is already verified.'
          : 'Verification email sent. Open the link in your inbox, then come back here and refresh your status.'
      );
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'We could not send the verification email.');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage('');

    try {
      await refreshUser();
      setMessageType('success');
      setMessage('Verification status refreshed.');
    } catch (error) {
      setMessageType('error');
      setMessage(error instanceof Error ? error.message : 'We could not refresh your verification status.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <p className="text-muted-foreground">Loading verification status...</p>
      </div>
    );
  }

  const showSuspendedMessage = currentUser.accountStatus === 'suspended' && currentUser.verificationSuspended;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-3xl">Verify Your Email To Continue</CardTitle>
          <CardDescription className="max-w-2xl text-sm">
            Your account is signed in, but email verification is required before you can use CampusTutor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSuspendedMessage ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your account is suspended because the email address was not verified within 5 days. Verify your email to restore access.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Check <span className="font-medium">{currentUser.email}</span> and click the verification link before continuing.
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert variant={messageType === 'success' ? 'default' : 'destructive'}>
              {messageType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border border-border bg-background/80 p-5">
            <p className="text-sm font-medium text-foreground">What happens next?</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>1. Send or re-send the verification email.</p>
              <p>2. Open the verification link from your inbox.</p>
              <p>3. Return here and refresh your status.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void handleSendVerification()} className="bg-primary hover:bg-primary/90" disabled={sending || refreshing}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Verification Email'
              )}
            </Button>
            <Button variant="outline" onClick={() => void handleRefresh()} disabled={refreshing || sending}>
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => void handleLogout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Need a different account? <Link href="/auth/login" className="font-medium text-primary hover:underline">Back to login</Link>
      </div>
    </div>
  );
}
