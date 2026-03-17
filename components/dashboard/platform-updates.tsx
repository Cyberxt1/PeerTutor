'use client';

import { BellRing, Rocket, Settings, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlatformUpdate, UserRole } from '@/lib/types';

type PlatformUpdatesProps = {
  updates: PlatformUpdate[];
  role: UserRole;
};

function getCategoryIcon(category: PlatformUpdate['category']) {
  if (category === 'coming-soon') return <Rocket className="h-4 w-4 text-primary" />;
  if (category === 'maintenance') return <Wrench className="h-4 w-4 text-amber-500" />;
  if (category === 'feature') return <Settings className="h-4 w-4 text-emerald-500" />;
  return <BellRing className="h-4 w-4 text-primary" />;
}

function getCategoryLabel(category: PlatformUpdate['category']) {
  if (category === 'coming-soon') return 'Coming Soon';
  if (category === 'maintenance') return 'Maintenance';
  if (category === 'feature') return 'Feature';
  return 'Announcement';
}

export default function PlatformUpdates({ updates, role }: PlatformUpdatesProps) {
  const visibleUpdates = updates
    .filter((update) => update.active && (update.audience === 'all' || update.audience === `${role}s`))
    .slice(0, 3);

  if (visibleUpdates.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          Platform Updates
        </CardTitle>
        <CardDescription>
          Important notes from the admin team for your account and activity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleUpdates.map((update) => (
          <div key={update.id} className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {getCategoryIcon(update.category)}
              <Badge variant="secondary">{getCategoryLabel(update.category)}</Badge>
              <Badge variant="outline" className="capitalize">
                {update.audience === 'all' ? 'All users' : update.audience}
              </Badge>
            </div>
            <p className="font-semibold text-foreground">{update.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{update.message}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(update.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
