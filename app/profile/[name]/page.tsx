import React from "react";
import { notFound } from "next/navigation";

// This page is for /profile/[name]
export default async function ProfilePage({
  params,
}: {
  params: { name: string };
}) {
  const { name } = params;

  // In a real app, fetch user data from your backend/database here
  // For now, just decode the name and show a placeholder
  const decodedName = decodeURIComponent(name);

  // Optionally, you could fetch more info here
  // If user not found, you could call notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary">
      <div className="bg-primary-dark rounded-lg shadow p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-primary mb-2">{decodedName}</h1>
        <div className="text-lg text-foreground mb-4">Profile page</div>
        {/* Add more user info here as needed */}
        <div className="text-sm text-foreground">
          More profile details coming soon.
        </div>
      </div>
    </main>
  );
}
