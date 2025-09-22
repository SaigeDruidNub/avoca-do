"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchInterests() {
      const res = await fetch("/api/user/interests");
      if (res.ok) {
        const data = await res.json();
        setSelected(Array.isArray(data.interests) ? data.interests : []);
      }
    }
    if (session?.user?.email) fetchInterests();
  }, [session?.user?.email]);

  const interestsList = [
    "Sports",
    "Music",
    "Art",
    "Technology",
    "Travel",
    "Cooking",
    "Fitness",
    "Reading",
    "Writing",
    "Gaming",
    "Movies",
    "Photography",
    "Fashion",
    "Gardening",
    "Spirituality",
    "Meditation",
    "Yoga",
    "Outdoors",
    "Animals",
    "Science",
    "History",
    "Politics",
    "Volunteering",
    "Crafts",
    "DIY",
    "Cars",
    "Collecting",
    "Dancing",
    "Theater",
    "Podcasts",
    "Board Games",
    "Anime",
    "Comics",
    "Investing",
    "Entrepreneurship",
    "Parenting",
    "Education",
    "Languages",
    "Food & Drink",
    "Nature",
    "Wellness",
  ];

  const handleChange = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
      if (res.ok) {
        setMessage("Interests updated!");
      } else {
        setMessage("Failed to update interests.");
      }
    } catch {
      setMessage("Failed to update interests.");
    }
    setSaving(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-primary">
      {/* Header with logo and user image */}
      <header className="w-full flex justify-between items-center p-4 bg-primary shadow-sm">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
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
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt="User avatar"
              className="w-10 h-10 rounded-full border border-gray-300 shadow"
            />
          )}
        </div>
      </header>
      {/* Main settings content */}
      <section className="flex flex-1 flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Settings</h1>
        <p className="text-lg text-foreground mb-6">
          Select your interests to personalize your experience.
        </p>
        <div className="w-full max-w-md bg-primary-dark rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Select your interests
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handleSave}>
            {interestsList.map((interest) => (
              <label
                key={interest}
                className="flex items-center gap-3 text-gray-700"
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={interest}
                  checked={selected.includes(interest)}
                  onChange={() => handleChange(interest)}
                  className="form-checkbox h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span>{interest}</span>
              </label>
            ))}
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Interests"}
            </button>
            {message && (
              <div className="text-sm mt-2 text-foreground">{message}</div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
