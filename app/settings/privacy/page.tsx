"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface PrivacyPreferences {
  onlyDiscoverableByEmail: boolean;
}

export default function PrivacySettingsPage() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    onlyDiscoverableByEmail: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch current privacy preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch("/api/privacy/preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.privacy);
        } else {
          console.error("Failed to fetch privacy preferences");
        }
      } catch (error) {
        console.error("Error fetching privacy preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchPreferences();
    }
  }, [session]);

  const handleToggle = async (key: keyof PrivacyPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(newPreferences);
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/privacy/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          privacy: newPreferences,
        }),
      });

      if (response.ok) {
        setMessage("Privacy preferences updated successfully!");
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating privacy preferences:", error);
      setMessage("Failed to update preferences. Please try again.");
      // Revert the change
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/settings"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            ← Back to Settings
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="text-lg">Loading privacy settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/settings"
          className="text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to Settings
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-foreground">
        Privacy Settings
      </h1>
      <p className="text-lg text-foreground/80 mb-8">
        Control how others can find and interact with you on the platform.
      </p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes("successfully")
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-primary-dark rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-secondary mb-4">
          Discovery Settings
        </h2>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-secondary mb-2">
                🔒 Email-Only Discovery
              </h3>
              <p className="text-secondary/80 text-sm leading-relaxed mb-2">
                When enabled, other users can only find you if they search for
                your exact email address. Your profile will not appear in
                general name searches or matching algorithms.
              </p>
              <p className="text-secondary/60 text-xs">
                This provides maximum privacy while still allowing friends who
                know your email to find you.
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={() => handleToggle("onlyDiscoverableByEmail")}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                  preferences.onlyDiscoverableByEmail
                    ? "bg-primary"
                    : "bg-gray-300"
                } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.onlyDiscoverableByEmail
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-primary-dark/50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-secondary mb-2">
          Privacy Information
        </h3>
        <div className="space-y-2 text-sm text-secondary/80">
          <p>
            <strong>Current Status:</strong>{" "}
            {preferences.onlyDiscoverableByEmail
              ? "Only discoverable by email address"
              : "Discoverable by name and email"}
          </p>
          <p>
            <strong>Your Email:</strong>{" "}
            {session?.user?.email || "Not available"}
          </p>
        </div>
      </div>
    </div>
  );
}
