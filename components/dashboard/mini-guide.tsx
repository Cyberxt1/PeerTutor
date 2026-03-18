'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@/lib/types';

type MiniGuideProps = {
  userId: string;
  role: UserRole;
  signInCount: number;
  title: string;
  description: string;
  steps: string[];
};

export default function MiniGuide({ userId, role, signInCount, title, description, steps }: MiniGuideProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (signInCount > 3) return;

    const storageKey = `campustutor-mini-guide-dismissed:${userId}:${role}`;
    const isDismissed = window.localStorage.getItem(storageKey) === 'true';

    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [role, signInCount, userId]);

  const handleDismiss = () => {
    window.localStorage.setItem(`campustutor-mini-guide-dismissed:${userId}:${role}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Quick Start
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-sm">{description}</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleDismiss} className="self-start">
          <X className="mr-2 h-4 w-4" />
          Dismiss
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step} className="rounded-xl border border-border bg-background/80 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">{step}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
