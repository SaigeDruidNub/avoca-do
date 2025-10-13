"use client";

import React, { useState } from "react";
import UserSearch from "@/components/UserSearch";
import ProfileImage from "@/app/profile/[id]/ProfileImage";
import Link from "next/link";

interface User {
  _id: string;
  name: string;
  email?: string;
  image?: string;
}

export default function UserSearchPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchHistory, setSearchHistory] = useState<User[]>([]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Add to search history if not already present
    setSearchHistory((prev) => {
      const exists = prev.some((u) => u._id === user._id);
      if (exists) return prev;
      return [user, ...prev.slice(0, 4)]; // Keep only last 5 searches
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-foreground">Search Users</h1>
      <p className="text-lg text-primary-dark mb-8">
        Find and connect with other users by searching for their name.
      </p>

      {/* Search Component */}
      <div className="mb-8">
        <UserSearch
          onUserSelect={handleUserSelect}
          placeholder="Search for users by name..."
          className="max-w-2xl"
        />
      </div>

      {/* Selected User Display */}
      {selectedUser && (
        <div className="mb-8 bg-primary-dark rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-secondary mb-4">
            Selected User
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <ProfileImage
              src={selectedUser.image}
              alt={selectedUser.name}
              className="w-16 h-16 rounded-full object-cover border border-gray-300"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-secondary">
                {selectedUser.name}
              </h3>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/profile/${encodeURIComponent(selectedUser._id)}`}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
            >
              View Profile
            </Link>
            <button
              onClick={() => setSelectedUser(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-primary-dark rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-secondary">
              Recent Searches
            </h2>
            <button
              onClick={clearHistory}
              className="text-sm text-secondary/60 hover:text-secondary underline"
            >
              Clear History
            </button>
          </div>
          <div className="space-y-3">
            {searchHistory.map((user) => (
              <div
                key={user._id}
                className="flex items-center gap-3 p-3 bg-primary/20 rounded-lg border border-gray-300"
              >
                <ProfileImage
                  src={user.image}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-secondary">{user.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-primary/80 transition-colors"
                  >
                    Select
                  </button>
                  <Link
                    href={`/profile/${encodeURIComponent(user._id)}`}
                    className="text-sm bg-secondary text-white px-3 py-1 rounded hover:bg-secondary/80 transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-4 bg-primary-dark/50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-primary-dark mb-2">
          Search Tips
        </h3>
        <ul className="space-y-1 text-sm text-secondary/80">
          <li>• Search by full name or partial name matches</li>
          <li>
            • Enter a complete email address to search by email (emails won't be
            displayed)
          </li>
          <li>• You won't see users you've blocked or who have blocked you</li>
          <li>• Click on any result to view their profile</li>
        </ul>
      </div>
    </div>
  );
}
