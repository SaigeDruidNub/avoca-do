"use client";
import React from "react";
import { useNotifications } from "./NotificationProvider";

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-secondary-dark rounded-full ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

interface NotificationDotProps {
  className?: string;
}

export function NotificationDot({ className = "" }: NotificationDotProps) {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <span
      className={`absolute block h-2 w-2 bg-secondary-dark rounded-full ${className}`}
    />
  );
}
