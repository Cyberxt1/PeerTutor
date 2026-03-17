'use client';

import { MailOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserNotification } from '@/lib/types';

type UserNotificationsProps = {
  notifications: UserNotification[];
};

export default function UserNotifications({ notifications }: UserNotificationsProps) {
  const visibleNotifications = notifications.filter((notification) => notification.active).slice(0, 3);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/60 bg-card/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailOpen className="h-5 w-5 text-primary" />
          Direct Admin Messages
        </CardTitle>
        <CardDescription>
          Important notifications sent specifically to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleNotifications.map((notification) => (
          <div key={notification.id} className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="font-semibold text-foreground">{notification.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
