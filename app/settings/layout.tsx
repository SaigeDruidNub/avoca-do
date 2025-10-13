"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import UserAvatar from "../../components/UserAvatar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigationItems = [
    { href: "/settings", label: "General", exact: true },
    { href: "/settings/privacy", label: "Privacy", exact: false },
    { href: "/settings/interests", label: "Interests", exact: false },
    { href: "/settings/otherhalves", label: "Other Halves", exact: false },
    { href: "/settings/blocked", label: "Rotten List", exact: false },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <main className="flex min-h-screen flex-col bg-primary">
      {/* Header with logo and user image */}
      <header className="w-full flex justify-between items-center p-4 bg-primary shadow-sm">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Link href="/dashboard">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        {/* Dashboard link and user image on the right */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Dashboard
          </Link>
          {session?.user && (
            <UserAvatar
              src={session.user.image}
              alt="User avatar"
              size="md"
              userId={session.user.email || undefined}
              className="shadow"
            />
          )}
        </div>
      </header>

      {/* Settings container */}
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar navigation */}
        <nav className="w-full lg:w-64 bg-primary-dark shadow-lg p-4 lg:p-6">
          <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-secondary">
            Settings
          </h1>
          <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
            {navigationItems.map((item) => (
              <li key={item.href} className="flex-shrink-0 lg:flex-shrink">
                <Link
                  href={item.href}
                  className={`block w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg transition-colors whitespace-nowrap lg:whitespace-normal text-sm lg:text-base ${
                    isActive(item.href, item.exact)
                      ? "bg-primary text-white"
                      : "text-secondary hover:bg-primary/20"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content area */}
        <div className="flex-1 p-4 lg:p-8">{children}</div>
      </div>
    </main>
  );
}
