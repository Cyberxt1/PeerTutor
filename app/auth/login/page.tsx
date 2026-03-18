'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/lib/context';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { isAdminUser } from '@/lib/platform';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const { currentUser, isLoading, isFirebaseConfigured, login } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !currentUser) return;

    if (isAdminUser(currentUser)) {
      router.replace('/addmean');
      return;
    }

    if (!currentUser.emailVerified) {
      router.replace('/auth/verify-email');
      return;
    }

    router.replace(currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard');
  }, [currentUser, isLoading, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResetStatus(params.get('reset'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signedInUser = await login(email, password);
      if (!signedInUser.emailVerified) {
        router.replace('/auth/verify-email');
        return;
      }
      router.replace(
        isAdminUser(signedInUser) ? '/addmean' : signedInUser.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button asChild variant="ghost" className="w-fit px-0 text-muted-foreground hover:text-foreground">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resetStatus === 'success' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your password has been updated. Sign in with your new password.
              </AlertDescription>
            </Alert>
          )}

          {!isFirebaseConfigured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Firebase is not configured yet. Add your `NEXT_PUBLIC_FIREBASE_*` values to your environment variables before using sign in.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured}
              />
            </Field>

            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured}
              />
            </Field>

            <div className="text-right text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading || !isFirebaseConfigured}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
