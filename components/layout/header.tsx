'use client';

import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/button';
import NotificationPanel from '@/components/notifications/notification-panel';
import { cn } from '@/lib/utils';
import { BookOpen, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function Header({ variant = 'default' }: { variant?: 'default' | 'landing' }) {
  const { currentUser, isAdmin, logout, platformSettings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState<'browse' | 'resources' | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const settingsPath = '/settings';
  const isAuthPage = pathname?.startsWith('/auth') ?? false;
  const publicNavLinks =
    variant === 'landing'
      ? [
          platformSettings.showAboutNav ? { href: '/about', label: 'About' } : null,
          platformSettings.showHowItWorksNav ? { href: '/how-it-works', label: 'How It Works' } : null,
          platformSettings.showContactNav ? { href: '/contact', label: 'Contact' } : null,
          platformSettings.showResourcesNav && platformSettings.allowResources
            ? { href: '/resources', label: 'Resources' }
            : null,
        ].filter((link): link is { href: string; label: string } => Boolean(link))
      : [
          platformSettings.allowTutorBrowsing && platformSettings.showBrowseTutorsNav
            ? { href: '/search-tutors', label: 'Find Tutors' }
            : null,
          platformSettings.allowResources && platformSettings.showResourcesNav
            ? { href: '/resources', label: 'Resources' }
            : null,
        ].filter((link): link is { href: string; label: string } => Boolean(link));

  useEffect(() => {
    if (!authPrompt) return;

    const timeoutId = window.setTimeout(() => {
      setAuthPrompt(null);
    }, 2800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authPrompt]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  const handleAuthPagePrompt = (prompt: 'browse' | 'resources') => {
    setAuthPrompt(prompt);
  };

  const authPromptMessage =
    authPrompt === 'browse'
      ? 'To browse tutors, create an account or log in to your account 😊'
      : 'To view resources, create an account or log in to your account 😊';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border',
        variant === 'landing'
          ? 'landing-header'
          : 'bg-white dark:bg-slate-950'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">CampusTutor</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {currentUser ? (
            <>
              <Link
                href={currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard'}
                className="text-foreground hover:text-primary transition"
              >
                Dashboard
              </Link>
              {platformSettings.allowResources && platformSettings.showResourcesNav && (
                <Link href="/resources" className="text-foreground hover:text-primary transition">
                  Resources
                </Link>
              )}
              <Link href={settingsPath} className="text-foreground hover:text-primary transition">
                Settings
              </Link>
              {platformSettings.allowTutorBrowsing && platformSettings.showBrowseTutorsNav && (
                <Link href="/search-tutors" className="text-foreground hover:text-primary transition">
                  Find Tutors
                </Link>
              )}
              {isAdmin && (
                <Link href="/addmean" className="text-foreground hover:text-primary transition">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-4">
                {!isAdmin && <NotificationPanel />}
                <span className="text-sm text-muted-foreground">{currentUser.name}</span>
                <Button onClick={() => void handleLogout()} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </>
              ) : (
            <>
              {isAuthPage ? (
                <>
                  <div className="auth-nav-bubble-anchor relative">
                    <button
                      type="button"
                      onClick={() => handleAuthPagePrompt('browse')}
                      className="text-foreground hover:text-primary transition"
                    >
                      Browse Tutors
                    </button>
                    {authPrompt === 'browse' && (
                      <div className="auth-nav-bubble">
                        {authPromptMessage}
                      </div>
                    )}
                  </div>
                  <div className="auth-nav-bubble-anchor relative">
                    <button
                      type="button"
                      onClick={() => handleAuthPagePrompt('resources')}
                      className="text-foreground hover:text-primary transition"
                    >
                      Resources
                    </button>
                    {authPrompt === 'resources' && (
                      <div className="auth-nav-bubble">
                        {authPromptMessage}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {publicNavLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="text-foreground hover:text-primary transition">
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(variant === 'landing' && 'landing-auth-login-button')}
              >
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className={cn(
                  'bg-primary hover:bg-primary/90',
                  variant === 'landing' && 'landing-auth-signup-button'
                )}
              >
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          {currentUser && !isAdmin && <NotificationPanel />}
          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          className={cn(
            'border-t border-border md:hidden',
            variant === 'landing'
              ? 'landing-header-mobile'
              : 'bg-white dark:bg-slate-950'
          )}
        >
          <div className="px-4 py-4 space-y-3 flex flex-col">
            {currentUser ? (
              <>
                <div className="py-2 text-sm font-medium text-muted-foreground">
                  Signed in as {currentUser.name}
                </div>
                <Link
                  href={currentUser.role === 'student' ? '/student/dashboard' : '/tutor/dashboard'}
                  className="block py-2 text-foreground hover:text-primary transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href={settingsPath}
                  className="block py-2 text-foreground hover:text-primary transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                {platformSettings.allowResources && platformSettings.showResourcesNav && (
                  <Link
                    href="/resources"
                    className="block py-2 text-foreground hover:text-primary transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Resources
                  </Link>
                )}
                {platformSettings.allowTutorBrowsing && platformSettings.showBrowseTutorsNav && (
                  <Link
                    href="/search-tutors"
                    className="block py-2 text-foreground hover:text-primary transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Find Tutors
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/addmean"
                    className="block py-2 text-foreground hover:text-primary transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Button onClick={() => void handleLogout()} variant="outline" size="sm" className="w-full justify-center">
                  Logout
                </Button>
              </>
            ) : (
              <>
                {isAuthPage ? (
                  <>
                    <div className="auth-nav-bubble-anchor relative">
                      <button
                        type="button"
                        onClick={() => handleAuthPagePrompt('browse')}
                        className="block py-2 text-left text-foreground hover:text-primary transition"
                      >
                        Browse Tutors
                      </button>
                      {authPrompt === 'browse' && (
                        <div className="auth-nav-bubble auth-nav-bubble-mobile">
                          {authPromptMessage}
                        </div>
                      )}
                    </div>
                    <div className="auth-nav-bubble-anchor relative">
                      <button
                        type="button"
                        onClick={() => handleAuthPagePrompt('resources')}
                        className="block py-2 text-left text-foreground hover:text-primary transition"
                      >
                        Resources
                      </button>
                      {authPrompt === 'resources' && (
                        <div className="auth-nav-bubble auth-nav-bubble-mobile">
                          {authPromptMessage}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {publicNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block py-2 text-foreground hover:text-primary transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-full justify-center',
                    variant === 'landing' && 'landing-auth-login-button'
                  )}
                >
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    'w-full bg-primary hover:bg-primary/90 justify-center',
                    variant === 'landing' && 'landing-auth-signup-button'
                  )}
                >
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
