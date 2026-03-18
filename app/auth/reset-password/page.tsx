'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { useApp } from '@/lib/context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const { confirmPasswordReset, isFirebaseConfigured } = useApp();
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const verifyCode = async () => {
      const searchCode = new URLSearchParams(window.location.search).get('oobCode') ?? '';

      if (!isFirebaseConfigured) {
        if (isActive) {
          setError('Firebase is not configured yet.');
          setIsVerifying(false);
        }
        return;
      }

      if (!searchCode) {
        if (isActive) {
          setError('This password reset link is incomplete or invalid.');
          setIsVerifying(false);
        }
        return;
      }

      try {
        const { verifyPasswordResetCodeRecord } = await import('@/lib/firebase/service');
        const verifiedEmail = await verifyPasswordResetCodeRecord(searchCode);

        if (isActive) {
          setCode(searchCode);
          setEmail(verifiedEmail);
          setIsVerifying(false);
        }
      } catch (verificationError) {
        if (isActive) {
          setError(verificationError instanceof Error ? verificationError.message : 'This reset link is invalid or has expired.');
          setIsVerifying(false);
        }
      }
    };

    void verifyCode();

    return () => {
      isActive = false;
    };
  }, [isFirebaseConfigured]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset(code, password);
      setSuccess('Your password has been reset successfully.');
      window.setTimeout(() => {
        router.replace('/auth/login?reset=success');
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Set a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {isVerifying ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating reset link...
            </div>
          ) : (
            !error && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input type="email" value={email} disabled />
                </Field>

                <Field>
                  <FieldLabel>New Password</FieldLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your new password"
                    required
                    disabled={isSubmitting}
                  />
                </Field>

                <Field>
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    disabled={isSubmitting}
                  />
                </Field>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="h-4 w-4" />
                      Reset Password
                    </>
                  )}
                </Button>
              </form>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
