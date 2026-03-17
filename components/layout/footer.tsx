'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LandingThemeName } from '@/lib/landing-theme';

interface FooterProps {
  variant?: 'default' | 'landing';
  landingTheme?: LandingThemeName;
  landingThemeOptions?: Array<{
    value: LandingThemeName;
    label: string;
    description: string;
  }>;
  onLandingThemeChange?: (theme: LandingThemeName) => void;
}

export default function Footer({
  variant = 'default',
  landingTheme,
  landingThemeOptions = [],
  onLandingThemeChange,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const showLandingThemePicker = Boolean(
    variant === 'landing' &&
      landingTheme &&
      onLandingThemeChange &&
      landingThemeOptions.length > 0
  );

  return (
    <footer
      className={cn(
        'mt-24 bg-slate-900 text-slate-100 dark:bg-slate-950',
        variant === 'landing' && 'landing-footer'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span>CampusTutor</span>
            </Link>
            <p className="text-sm text-slate-300">
              Peer-to-peer tutoring platform connecting students with experienced tutors.
            </p>
          </div>

          {/* For Students */}
          <div>
            <h3 className="font-semibold mb-4">For Students</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/search-tutors" className="transition hover:text-white">
                  Find Tutors
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="transition hover:text-white">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition hover:text-white">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* For Tutors */}
          <div>
            <h3 className="font-semibold mb-4">For Tutors</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/auth/signup" className="transition hover:text-white">
                  Become a Tutor
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="transition hover:text-white">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link href="/about" className="transition hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition hover:text-white">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className={cn(
            'pt-8 text-sm',
            variant === 'landing'
              ? 'landing-footer-divider flex flex-col gap-6 md:flex-row md:items-center md:justify-between'
              : 'border-t border-slate-700 text-center text-slate-300'
          )}
        >
          <p className={cn('text-slate-300', variant === 'landing' ? 'text-center md:text-left' : undefined)}>
            &copy; {currentYear} CampusTutor. All rights reserved.
          </p>

          {showLandingThemePicker && (
            <div className="space-y-3">
              <div className="text-center md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Landing theme</p>
                <p className="mt-1 text-sm text-slate-300">
                  Switch the homepage palette anytime.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2 md:justify-end">
                {landingThemeOptions.map((theme) => {
                  const isActive = landingTheme === theme.value;

                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => onLandingThemeChange?.(theme.value)}
                      className={cn(
                        'landing-theme-chip',
                        isActive && 'landing-theme-chip-active'
                      )}
                      aria-pressed={isActive}
                      title={theme.description}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
