"use client";
import React, { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  userId?: string;
  fallbackSrc?: string;
}

// Helper function to generate RoboHash cat avatar
const getRoboHashAvatar = (identifier: string) => {
  const hash = identifier || "default";
  return `https://robohash.org/${encodeURIComponent(
    hash
  )}?set=set4&size=200x200`;
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "User avatar",
  size = "md",
  className = "",
  userId,
  fallbackSrc = "/logo.png",
}) => {
  const [imgSrc, setImgSrc] = useState(() => {
    if (src && src.trim() !== "") return src;
    if (userId) return getRoboHashAvatar(userId);
    return fallbackSrc;
  });

  // Size variants - all include object-cover for proper aspect ratio handling
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-24 h-24",
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const currentSrc = e.currentTarget.src;

    // Try to fix Google image URL if present
    if (
      currentSrc.includes("googleusercontent.com") &&
      !currentSrc.includes("referrer") &&
      src
    ) {
      const newUrl = src.replace("=s96-c", "=s96-c-rp-mo-br100");
      if (newUrl && newUrl !== currentSrc) {
        setImgSrc(newUrl);
        return;
      }
    }

    // Try RoboHash avatar if we have userId and haven't tried it yet
    if (userId && !currentSrc.includes("robohash.org")) {
      setImgSrc(getRoboHashAvatar(userId));
      return;
    }

    // Final fallback
    setImgSrc(fallbackSrc);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover border border-gray-300 ${className}`}
      style={{
        objectFit: "cover",
        aspectRatio: "1 / 1",
        objectPosition: "center center",
      }}
      onError={handleError}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
};

export default UserAvatar;
