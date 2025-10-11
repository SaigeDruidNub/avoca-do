"use client";
import React, { useState, useEffect } from "react";

interface BlockUserButtonProps {
  userId: string;
}

const BlockUserButton: React.FC<BlockUserButtonProps> = ({ userId }) => {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already blocked when component mounts
  useEffect(() => {
    const checkBlockedStatus = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const userData = await res.json();
          const isBlocked =
            userData.blocked && userData.blocked.includes(userId);
          setBlocked(isBlocked);
        }
      } catch (error) {
        console.error("Error checking blocked status:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkBlockedStatus();
  }, [userId]);

  const handleBlock = async () => {
    setLoading(true);
    setError(null);
    try {
      if (blocked) {
        // Unblock user
        console.log("Attempting to unblock user with ID:", userId);
        const res = await fetch("/api/user/unblock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        console.log("Unblock API response:", res.status, data);

        if (res.ok) {
          setBlocked(false);
          console.log("User unblocked successfully:", data);
        } else {
          console.error("Failed to unblock user:", data);
          setError(data.error || data.message || "Failed to unblock user");
        }
      } else {
        // Block user
        console.log("Attempting to block user with ID:", userId);
        const res = await fetch("/api/user/block", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        console.log("Block API response:", res.status, data);

        if (res.ok) {
          setBlocked(true);
          console.log("User blocked successfully:", data);
        } else {
          console.error("Failed to block user:", data);
          setError(data.error || data.message || "Failed to block user");
        }
      }
    } catch (error) {
      console.error("Network error while blocking/unblocking user:", error);
      setError(blocked ? "Failed to unblock user" : "Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className={`px-4 py-2 rounded shadow transition ${
          blocked
            ? "bg-secondary-dark text-white hover:bg-secondary-dark"
            : "bg-secondary text-white hover:bg-secondary"
        } ${loading || initialLoading ? "opacity-60" : ""}`}
        type="button"
        disabled={loading || initialLoading}
        onClick={handleBlock}
      >
        {initialLoading
          ? "Loading..."
          : blocked
          ? loading
            ? "Removing from Rotten List..."
            : "Remove from Rotten List"
          : loading
          ? "Marking as Rotten..."
          : "🚫 Rotten List"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default BlockUserButton;
