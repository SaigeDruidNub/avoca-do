"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface RottenUser {
  id: string;
  name: string;
  image?: string;
}

export default function RottenListSettingsPage() {
  const { data: session } = useSession();
  const [rottenUsers, setRottenUsers] = useState<RottenUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchRottenUsers() {
      try {
        const res = await fetch("/api/user/blocked");
        if (res.ok) {
          const data = await res.json();
          setRottenUsers(data.blockedUsers || []);
        } else {
          setMessage("Failed to load rotten list");
        }
      } catch (error) {
        setMessage("Error loading rotten list");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.email) {
      fetchRottenUsers();
    }
  }, [session?.user?.email]);

  const handleRemoveFromRotten = async (userId: string, userName: string) => {
    setRemovingUserId(userId);
    setMessage("");

    try {
      const res = await fetch("/api/user/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        // Remove the user from the rotten list
        setRottenUsers((prev) => prev.filter((user) => user.id !== userId));
        setMessage(`Successfully removed ${userName} from rotten list`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        const errorData = await res.json();
        setMessage(
          `Failed to remove user from rotten list: ${
            errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      setMessage("Error removing user from rotten list");
    } finally {
      setRemovingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Rotten List</h1>
        <div className="bg-primary-dark rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-secondary">Loading rotten list...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Rotten List</h1>
      <p className="text-lg text-primary-dark mb-6">
        Manage users on your rotten list. You can remove users from your rotten
        list to allow them to interact with you again.
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

        {rottenUsers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-medium text-primary mb-2">
              Your rotten list is empty
            </h3>
            <p className="text-primary">
              You haven't added anyone to your rotten list yet. When you add
              someone, they'll appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-secondary">
                Rotten List ({rottenUsers.length})
              </h2>
              <p className="text-sm text-primary mt-1">
                These users cannot see your posts or send you messages.
              </p>
            </div>

            <div className="space-y-4">
              {rottenUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/10 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={`${user.name}'s profile`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border border-gray-300"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-secondary">
                        {user.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFromRotten(user.id, user.name)}
                    disabled={removingUserId === user.id}
                    className="px-3 sm:px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base w-full sm:w-auto"
                  >
                    {removingUserId === user.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-primary rounded-lg border border-secondary">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> Removing a user from your rotten list
                will allow them to see your posts and send you messages again.
                They will not be automatically added back to your friends list.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
