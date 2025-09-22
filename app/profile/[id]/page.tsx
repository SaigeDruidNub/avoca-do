import React from "react";
import { notFound } from "next/navigation";

import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";

interface User {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  about?: string;
  interests?: string[];
  location?: { city?: string };
  [key: string]: unknown;
}

// This page is for /profile/[id]

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  await dbConnect();
  const user = (await UserModel.findById(params.id).lean()) as User | null;
  if (!user) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary">
      <div className="bg-primary-dark rounded-lg shadow p-8 w-full max-w-md flex flex-col items-center">
        {/* Consider using next/image for better performance */}
        <img
          src={user.image || "/logo.png"}
          alt={user.name || user.email}
          className="w-24 h-24 rounded-full border border-gray-300 mb-4"
        />
        <h1 className="text-3xl font-bold text-primary mb-2">
          {user.name || user.email}
        </h1>
        <div className="text-lg text-foreground mb-4">{user.email}</div>
        {user.about && (
          <div className="text-base text-foreground mb-2">{user.about}</div>
        )}
        {user.interests && user.interests.length > 0 && (
          <div className="text-sm text-foreground mb-2">
            Interests: {user.interests.join(", ")}
          </div>
        )}
        {user.location?.city && (
          <div className="text-sm text-foreground mb-2">
            Location: {user.location.city}
          </div>
        )}
        {/* Add more user info here as needed */}
      </div>
    </main>
  );
}
