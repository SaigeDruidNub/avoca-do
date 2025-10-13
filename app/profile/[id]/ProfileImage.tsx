"use client";
import React, { useState } from "react";

interface ProfileImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState(src || "/logo.png");

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`object-cover ${className || ""}`}
      style={{
        objectFit: "cover",
        aspectRatio: "1 / 1",
        objectPosition: "center center",
      }}
      onError={(e) => {
        const currentSrc = e.currentTarget.src;
        // Try to fix Google image URL if present
        if (
          currentSrc.includes("googleusercontent.com") &&
          !currentSrc.includes("referrer")
        ) {
          const newUrl = src?.replace("=s96-c", "=s96-c-rp-mo-br100");
          if (newUrl && newUrl !== currentSrc) {
            setImgSrc(newUrl);
            return;
          }
        }
        setImgSrc("/logo.png");
      }}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />
  );
};

export default ProfileImage;
