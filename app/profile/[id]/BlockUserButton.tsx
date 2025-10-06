"use client";
import React, { useState } from "react";

interface BlockUserButtonProps {
  userId: string;
}

const BlockUserButton: React.FC<BlockUserButtonProps> = ({ userId }) => {
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlock = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlocked(true);
      } else {
        setError(data.error || data.message || "Failed to block user");
      }
    } catch {
      setError("Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        className={`bg-secondary-dark text-white px-4 py-2 rounded shadow hover:bg-secondary-dark transition ${
          blocked ? "opacity-60 cursor-not-allowed" : ""
        }`}
        type="button"
        disabled={blocked || loading}
        onClick={handleBlock}
      >
        {blocked ? "User Blocked" : loading ? "Blocking..." : "🚫 Block User"}
      </button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default BlockUserButton;
