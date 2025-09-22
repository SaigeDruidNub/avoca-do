"use client";
import React from "react";

export default function AddOtherHalfButton({
  friendId,
  onAdded,
}: {
  friendId: string;
  onAdded?: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAddFriend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdded(true);
        if (onAdded) onAdded();
      } else {
        setError(data.error || data.message || "Failed to add friend");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className="bg-accent text-white px-4 py-2 rounded shadow hover:bg-accent-dark transition disabled:opacity-50"
        onClick={handleAddFriend}
        disabled={loading || added}
      >
        {added ? "Added!" : loading ? "Adding..." : "Add as Other Half"}
      </button>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
