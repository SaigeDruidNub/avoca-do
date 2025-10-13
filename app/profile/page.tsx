"use client";
import React, { useState, useRef, useEffect } from "react";

// Removed unused imports

import Link from "next/link";
import UserAvatar from "../../components/UserAvatar";

export default function MyProfilePageWrapper() {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    image: "",
    pronouns: "",
    maritalStatus: "",
    job: "",
    school: "",
    about: "",
    interests: [] as string[],
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user session/profile on mount (client-side fetch)
  async function fetchProfile() {
    const res = await fetch("/api/user/me");
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) => ({ ...prev, ...data }));
      setImagePreview(data.image || null);
    } else if (res.status === 401) {
      window.location.href = "/login";
    }
  }
  useEffect(() => {
    fetchProfile();
    fetchFriends();
  }, []);

  async function fetchFriends() {
    setLoadingFriends(true);
    try {
      const res = await fetch("/api/user/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } finally {
      setLoadingFriends(false);
    }
  }

  function handleEditClick() {
    setEditMode(true);
  }

  function handleCancel() {
    setEditMode(false);
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== "image")
        formData.append(
          key,
          typeof value === "string"
            ? value
            : Array.isArray(value)
            ? value.join(",")
            : ""
        );
    });
    if (imageFile) {
      formData.append("image", imageFile);
    }
    const res = await fetch("/api/user/me", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      setEditMode(false);
      await fetchProfile();
      // Refresh NextAuth session so new image appears in header
      try {
        await fetch("/api/auth/session?update", { method: "POST" });
      } catch (err) {
        // Ignore errors, session will update on next login
      }
    } else {
      alert("Failed to update profile");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-primary">
      {/* Header with logo and user image */}
      <header className="w-full flex justify-between items-center p-4 bg-primary shadow-sm">
        <div className="flex items-center">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Logo" className="h-20 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/chat"
            className="text-sm font-medium text-foreground hover:underline"
          >
            💬 Messages
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Settings
          </Link>
        </div>
      </header>
      <div className="bg-primary-dark rounded-lg shadow p-8 w-full max-w-md flex flex-col items-center mx-auto mt-8">
        {/* Other Halves Section */}
        <div className="w-full mb-6">
          <h2 className="text-xl font-bold text-primary mb-2">Other Halves</h2>
          {loadingFriends ? (
            <div className="text-primary">Loading...</div>
          ) : friends.length === 0 ? (
            <div className="text-primary">No other halves yet.</div>
          ) : (
            <ul className="space-y-2">
              {friends.map((f) => (
                <li
                  key={f._id}
                  className="flex items-center gap-3 bg-primary rounded p-2"
                >
                  <UserAvatar
                    src={f.image}
                    alt={f.name || f.email}
                    size="sm"
                    userId={f._id}
                  />
                  <span className="font-medium text-primary-dark">
                    {f.name || f.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <h1 className="text-3xl font-bold text-primary mb-2">
          {profile.name || "My Profile"}
        </h1>
        <UserAvatar
          src={imagePreview || profile.image}
          alt={profile.name || "User avatar"}
          size="xl"
          userId={profile.email}
          className="mb-4"
        />
        {!editMode && (
          <>
            {profile.pronouns && (
              <div className="text-sm text-primary mb-2">
                <span className="font-bold">Pronouns:</span> {profile.pronouns}
              </div>
            )}
            {profile.maritalStatus && (
              <div className="text-sm text-primary mb-2">
                <span className="font-bold">Marital Status:</span>{" "}
                {profile.maritalStatus}
              </div>
            )}
            {profile.job && (
              <div className="text-sm text-primary mb-2">
                <span className="font-bold">Job:</span> {profile.job}
              </div>
            )}
            {profile.school && (
              <div className="text-sm text-primary mb-2">
                <span className="font-bold">School:</span> {profile.school}
              </div>
            )}
            {profile.about && (
              <div className="text-sm text-primary mb-2">
                <span className="font-bold">About:</span> {profile.about}
              </div>
            )}
            {Array.isArray(profile.interests) &&
              profile.interests.length > 0 && (
                <div className="text-sm text-primary mb-2">
                  <span className="font-bold">Interests:</span>{" "}
                  {profile.interests.join(", ")}
                </div>
              )}
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              onClick={handleEditClick}
            >
              Edit Profile
            </button>
          </>
        )}
        {editMode && (
          <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>
            <label className="text-sm text-primary">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              name="image"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">Pronouns</label>
            <input
              type="text"
              name="pronouns"
              value={profile.pronouns}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">Marital Status</label>
            <input
              type="text"
              name="maritalStatus"
              value={profile.maritalStatus}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">Job</label>
            <input
              type="text"
              name="job"
              value={profile.job}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">School</label>
            <input
              type="text"
              name="school"
              value={profile.school}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
            />
            <label className="text-sm text-primary">About</label>
            <textarea
              name="about"
              value={profile.about}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="bg-primary text-white rounded px-4 py-2 font-medium hover:bg-primary-dark"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-gray-400 text-white rounded px-4 py-2 font-medium hover:bg-gray-500"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
