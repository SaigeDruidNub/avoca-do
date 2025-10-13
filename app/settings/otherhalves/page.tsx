"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import UserAvatar from "../../../components/UserAvatar";
import Link from "next/link";

interface OtherHalf {
  _id: string;
  name: string;
  image?: string;
}

export default function OtherHalvesSettingsPage() {
  const { data: session } = useSession();
  const [otherHalves, setOtherHalves] = useState<OtherHalf[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchOtherHalves() {
      try {
        const res = await fetch("/api/user/otherhalves");
        if (res.ok) {
          const data = await res.json();
          setOtherHalves(data || []);
        } else {
          setMessage("Failed to load other halves");
        }
      } catch (error) {
        setMessage("Error loading other halves");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchOtherHalves();
    }
  }, [session?.user?.email]);

  const handleRemoveOtherHalf = async (userId: string, userName: string) => {
    setRemovingUserId(userId);
    setMessage("");

    try {
      const res = await fetch("/api/user/removefriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        // Remove the user from the other halves list
        setOtherHalves((prev) => prev.filter((user) => user._id !== userId));
        setMessage(`Successfully removed ${userName} from your other halves`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await res.json();
        setMessage(
          `Failed to remove other half: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      setMessage("Error removing other half");
    } finally {
      setRemovingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Other Halves
        </h1>
        <div className="bg-primary-dark rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-secondary">Loading other halves...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Other Halves</h1>
      <p className="text-lg text-primary-dark mb-6">
        Manage your other halves (friends). You can view their profiles or
        remove them from your list.
      </p>

      <div className="bg-primary-dark rounded-lg shadow p-6">
        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.includes("Successfully")
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {otherHalves.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💫</div>
            <h3 className="text-xl font-medium text-primary mb-2">
              No other halves yet
            </h3>
            <p className="text-primary">
              You haven't connected with any other halves yet. When you make
              friends, they'll appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-secondary">
                Your Other Halves ({otherHalves.length})
              </h2>
              <p className="text-sm text-primary mt-1">
                These are your connected friends. You can view their profiles or
                remove them.
              </p>
            </div>

            <div className="space-y-4">
              {otherHalves.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/10 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={user.image}
                      alt={`${user.name}'s profile`}
                      size="md"
                      userId={user._id}
                    />
                    <div>
                      <h3 className="font-medium text-secondary">
                        {user.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link
                      href={`/profile/${encodeURIComponent(user._id)}`}
                      className="px-3 sm:px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/80 transition-colors text-center text-sm sm:text-base"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => handleRemoveOtherHalf(user._id, user.name)}
                      disabled={removingUserId === user._id}
                      className="px-3 sm:px-4 py-2 bg-secondary-dark text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      {removingUserId === user._id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-primary rounded-lg border border-secondary">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> Removing an other half will remove them
                from your friends list only. They will still have you as a
                friend unless they also remove you from their list. You can
                re-add them at any time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
