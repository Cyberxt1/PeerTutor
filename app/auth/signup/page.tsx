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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { isAdminUser } from '@/lib/platform';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, isLoading, isFirebaseConfigured, platformSettings, signup } = useApp();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!platformSettings.allowNewSignups) {
      setError('New account creation is temporarily disabled by the administrator.');
      return;
    }

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = await signup(name, email, password, role);
      router.replace(isAdminUser(user) ? '/addmean' : '/auth/verify-email');
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
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join CampusTutor and start learning or teaching</CardDescription>
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

          {!isFirebaseConfigured && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Firebase is not configured yet. Add your `NEXT_PUBLIC_FIREBASE_*` values to your environment variables before creating accounts.
              </AlertDescription>
            </Alert>
          )}

          {!platformSettings.allowNewSignups && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                New account creation is temporarily paused right now. Please try again later or contact support.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
              />
            </Field>

            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
              />
            </Field>

            <Field>
              <FieldLabel>I want to</FieldLabel>
              <ToggleGroup
                type="single"
                value={role}
                onValueChange={(value) => setRole((value as 'student' | 'tutor') || 'student')}
                disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
              >
                <ToggleGroupItem value="student" aria-label="Learn as student">
                  Learn
                </ToggleGroupItem>
                <ToggleGroupItem value="tutor" aria-label="Teach as tutor">
                  Teach
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
              />
            </Field>

            <Field>
              <FieldLabel>Confirm Password</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
              />
            </Field>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading || !isFirebaseConfigured || !platformSettings.allowNewSignups}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
