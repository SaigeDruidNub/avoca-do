import React from "react";
import { notFound } from "next/navigation";
import AddOtherHalfButton from "./AddOtherHalfButton";
import ProfileImage from "./ProfileImage";
import BlockUserButton from "./BlockUserButton";

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
  pronouns?: string;
  maritalStatus?: string;
  job?: string;
  school?: string;
  [key: string]: unknown;
}

// This page is for /profile/[id]

// Next.js 15+ expects params to be a Promise
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<unknown>;
};

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  await dbConnect();
  const user = (await UserModel.findById(id).lean()) as User | null;
  if (!user) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary">
      <div className="w-full max-w-md flex flex-row justify-center items-center mb-4">
        <div className="flex gap-4 w-full justify-center">
          <a href="/dashboard" className="w-40">
            <button
              className="w-full h-16 bg-accent text-white text-lg font-medium rounded shadow hover:bg-accent-dark transition flex items-center justify-center"
              type="button"
            >
              &larr; Back to Dashboard
            </button>
          </a>
          <a href={`/chat?with=${user._id}`} className="w-40">
            <button
              className="w-full h-16 bg-secondary text-white text-lg font-medium rounded shadow hover:bg-secondary transition flex items-center justify-center"
              type="button"
            >
              💬 Send Message
            </button>
          </a>
          <div className="w-40">
            <AddOtherHalfButton friendId={String(user._id)} />
          </div>
          <div className="w-40">
            <BlockUserButton userId={String(user._id)} />
          </div>
        </div>
      </div>
      <div className="bg-primary-dark rounded-lg shadow p-8 w-full max-w-md flex flex-col items-center">
        {/* Consider using next/image for better performance */}
        <ProfileImage
          src={user.image}
          alt={user.name || user.email}
          className="w-24 h-24 rounded-full border border-gray-300 mb-4"
        />
        <h1 className="text-3xl font-bold text-primary mb-2">{user.name}</h1>
        {user.pronouns && (
          <div className="text-base text-primary mb-2">
            <span className="font-bold">Pronouns:</span> {user.pronouns}
          </div>
        )}
        {user.maritalStatus && (
          <div className="text-base text-primary mb-2">
            <span className="font-bold">Marital Status:</span>{" "}
            {user.maritalStatus}
          </div>
        )}
        {user.job && (
          <div className="text-base text-primary mb-2">
            <span className="font-bold">Job:</span> {user.job}
          </div>
        )}
        {user.school && (
          <div className="text-base text-primary mb-2">
            <span className="font-bold">School:</span> {user.school}
          </div>
        )}
        {user.about && (
          <div className="text-base text-primary mb-2">
            <span className="font-bold">About:</span> {user.about}
          </div>
        )}
        {user.interests && user.interests.length > 0 && (
          <div className="text-sm text-primary mb-2">
            <span className="font-bold">Interests:</span>{" "}
            {user.interests.join(", ")}
          </div>
        )}
        {user.location?.city && (
          <div className="text-sm text-primary mb-2">
            Location: {user.location.city}
          </div>
        )}
        {/* Add more user info here as needed */}
      </div>
    </main>
  );
}
