'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, MailOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/lib/context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type NotificationPanelProps = {
  className?: string;
};

export default function NotificationPanel({ className }: NotificationPanelProps) {
  const { userNotifications, markNotificationsAsRead, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const activeNotifications = useMemo(
    () => userNotifications.filter((notification) => notification.active),
    [userNotifications]
  );
  const unreadNotifications = useMemo(
    () => activeNotifications.filter((notification) => notification.readAt === null),
    [activeNotifications]
  );
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (!open || unreadCount === 0) {
      return;
    }

    void markNotificationsAsRead(unreadNotifications.map((notification) => notification.id)).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
    });
  }, [markNotificationsAsRead, open, unreadCount, unreadNotifications]);

  const handleClearAll = async () => {
    if (activeNotifications.length === 0) {
      return;
    }

    setIsClearing(true);

    try {
      await clearNotifications(activeNotifications.map((notification) => notification.id));
      toast.success('Notifications cleared.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to clear notifications.');
    } finally {
      setIsClearing(false);
    }
  };

  const formattedUnreadCount = unreadCount > 99 ? '99+' : `${unreadCount}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative rounded-full', className)}
          aria-label={
            unreadCount > 0
              ? `Open notifications. You have ${unreadCount} new notifications.`
              : 'Open notifications'
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm">
              {formattedUnreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </DialogTitle>
              <DialogDescription className="mt-2">
                Direct admin messages sent to your account.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleClearAll()}
              disabled={activeNotifications.length === 0 || isClearing}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </DialogHeader>

        {activeNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
              <MailOpen className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground">No notifications yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              When an admin sends you a direct message, it will show up here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[min(26rem,calc(90vh-10rem))] px-6 py-5">
            <div className="space-y-3 pr-4">
              {activeNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-2xl border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{notification.title}</p>
                        {notification.readAt === null && (
                          <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                      <MailOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {notification.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
