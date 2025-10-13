"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  const settingsCards = [
    {
      title: "Search Users",
      description:
        "Find and connect with other users by searching for their name or email address.",
      href: "/settings/search",
      icon: "🔍",
    },
    {
      title: "Interests",
      description:
        "Manage your interests to personalize your experience and connect with like-minded people.",
      href: "/settings/interests",
      icon: "🎯",
    },
    {
      title: "Other Halves",
      description:
        "View and manage your other halves (friends). You can view their profiles or remove them from your list.",
      href: "/settings/otherhalves",
      icon: "🥑",
    },
    {
      title: "Privacy",
      description:
        "Control your discoverability and privacy settings. Choose who can find you and how they can contact you.",
      href: "/settings/privacy",
      icon: "🔒",
    },
    {
      title: "Rotten List",
      description:
        "Manage your rotten list of users who cannot interact with you. Remove users to restore their access.",
      href: "/settings/blocked",
      icon: "🍎",
    },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-foreground">
        General Settings
      </h1>
      <p className="text-lg text-foreground/80 mb-8">
        Welcome to your settings, {session?.user?.name || "User"}. Choose a
        category below to customize your experience.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block bg-primary-dark rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-primary/50"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{card.icon}</div>
              <div>
                <h2 className="text-xl font-semibold text-secondary mb-2">
                  {card.title}
                </h2>
                <p className="text-secondary/80 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-4 bg-primary-dark/50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-secondary mb-2">
          Account Information
        </h3>
        <div className="space-y-2 text-sm text-secondary/80">
          <p>
            <strong>Name:</strong> {session?.user?.name || "Not available"}
          </p>
          <p>
            <strong>Email:</strong> {session?.user?.email || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );
}
