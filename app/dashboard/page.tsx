// Use email as unique user identifier for likes/dislikes
"use client";
import React, { useState, useEffect as useReactEffect } from "react";
import Link from "next/link";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "../../components/LanguageProvider";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { NotificationDot } from "../../components/NotificationBadge";
import EmojiPicker from "../../components/EmojiPicker";
import GifPicker from "../../components/GifPicker";

export default function DashboardPage() {
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  // Notifications
  const { refreshUnreadCount } =
    require("../../components/NotificationProvider").useNotifications();

  const { t } = useTranslation();

  // Helper function to generate RoboHash cat avatar
  const getRoboHashAvatar = (identifier: string) => {
    // Use user ID or name/email as identifier for consistent avatars
    const hash = identifier || "default";
    return `https://robohash.org/${encodeURIComponent(
      hash
    )}?set=set4&size=200x200`;
  };

  // Friends and suggested users state (must be above useEffects that use them)
  interface Friend {
    _id: string;
    name?: string;
    image?: string;
    interests?: string[];
  }
  interface SuggestedUser {
    _id: string;
    name?: string;
    email?: string;
    image?: string;
    interests?: string[];
    distance?: number;
    matchType?: "location" | "interests" | "fallback";
    sharedInterests?: string[];
  }
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  // Suggested search mode: 'nearby' or 'interests'
  const [suggestedMode, setSuggestedMode] = useState<"nearby" | "interests">(
    "nearby"
  );
  // Selected interest for nearby+interest search
  // (already declared, remove duplicate)
  // Current user profile (for interests)
  const [userProfile, setUserProfile] = useState<{
    _id?: string;
    name?: string;
    email?: string;
    image?: string;
    pronouns?: string;
    maritalStatus?: string;
    job?: string;
    school?: string;
    about?: string;
    interests: string[];
  } | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch {}
    }
    fetchProfile();
  }, []);

  // Selected interest for nearby+interest search
  const [selectedInterest, setSelectedInterest] = useState<string>("");

  // Modal state for viewing images
  const [modalImage, setModalImage] = useState<string | null>(null);
  // Media feed state
  type Post = {
    _id: string;
    userId: string;
    userImage?: string;
    userName?: string;
    message?: string;
    imageUrl?: string;
    gifUrl?: string;
    createdAt?: string;
    likes?: string[]; // array of userIds who liked
    dislikes?: string[]; // array of userIds who disliked
    comments?: Comment[];
  };
  type Comment = {
    _id: string;
    userId: string;
    userName?: string;
    message: string;
    createdAt?: string;
    gifUrl?: string;
  };
  const [posts, setPosts] = useState<Post[]>([]);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);
  const [dislikeLoading, setDislikeLoading] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [commentGifUrls, setCommentGifUrls] = useState<Record<string, string>>(
    {}
  );
  const [commentLoading, setCommentLoading] = useState<string | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<
    string,
    { name: string; image?: string }
  > | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<
    Record<string, boolean>
  >({});
  const [showPostEmojiPicker, setShowPostEmojiPicker] = useState(false);
  const [postInput, setPostInput] = useState("");
  const [showGifPicker, setShowGifPicker] = useState<Record<string, boolean>>(
    {}
  );
  const [showPostGifPicker, setShowPostGifPicker] = useState(false);
  const [postGifUrl, setPostGifUrl] = useState("");

  // Post submit handler
  async function handlePostSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    // If a GIF is selected, add it to the form data
    if (postGifUrl) {
      formData.append("gifUrl", postGifUrl);
    }
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setPostError(err.error || "Failed to post");
        setPosting(false);
        return;
      }
      form.reset();
      setPostInput("");
      setPostGifUrl("");
      // Refresh posts
      fetchPosts();
    } catch {
      setPostError("Failed to post");
    } finally {
      setPosting(false);
    }
  }

  // Fetch posts (self + friends) and user info for each post
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/feed");
      if (res.ok) {
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
        // Collect unique userIds from posts
        const userIds = Array.from(
          new Set((Array.isArray(data) ? data : []).map((p: any) => p.userId))
        );
        // Fetch user info for each userId
        if (userIds.length > 0) {
          const usersRes = await fetch(
            `/api/user/byid?ids=${userIds.join(",")}`
          );
          if (usersRes.ok) {
            const users = await usersRes.json();
            // users: array of { _id, name, image }
            const map: Record<string, { name: string; image?: string }> = {};
            users.forEach((u: any) => {
              map[u._id] = { name: u.name, image: u.image };
            });
            setUserMap(map);
          } else {
            setUserMap(null);
          }
        } else {
          setUserMap(null);
        }
      } else {
        setPosts([]);
        setUserMap(null);
      }
    } catch {
      setPosts([]);
      setUserMap(null);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch posts and refresh notifications on mount
  useEffect(() => {
    fetchPosts();
    refreshUnreadCount();
    // Refresh notifications when window regains focus
    const handleFocus = () => {
      refreshUnreadCount();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Radius state (in miles)
  const [radius, setRadius] = useState<number>(10);
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [cityState, setCityState] = useState<string | null>(null);
  // Remove locationShared state

  // On mount, check if location has been shared before
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(coords);
          setLocError(null);
          localStorage.setItem("userLocation", JSON.stringify(coords));
        },
        (error) => {
          console.log("Location access declined or failed:", error);
          setLocError(
            "Location sharing declined. You can still discover other halves through shared interests!"
          );
          // Set a default location for interest-based matching
          setLocation({ lat: 0, lng: 0 });
        }
      );
    } else {
      // Fallback if geolocation not supported
      setLocError(
        "Geolocation not supported. You can still discover other halves through shared interests!"
      );
      setLocation({ lat: 0, lng: 0 });
    }
  }, []);

  // Reverse geocode to city/state when location changes
  useReactEffect(() => {
    const fetchCityState = async () => {
      if (!location) return;
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setCityState(null);
          setLocError("Google Maps API key not found.");
          return;
        }
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
        );
        const data = await res.json();
        console.log("Geocoding API response:", data);
        if (data.status === "OK" && data.results.length > 0) {
          type AddressComponent = {
            long_name: string;
            short_name: string;
            types: string[];
          };
          const address: AddressComponent[] =
            data.results[0].address_components;
          const city = address.find((c: AddressComponent) =>
            c.types.includes("locality")
          )?.long_name;
          const state = address.find((c: AddressComponent) =>
            c.types.includes("administrative_area_level_1")
          )?.short_name;
          if (city && state) {
            setCityState(`${city}, ${state}`);
          } else {
            setCityState(null);
          }
        } else {
          setCityState(null);
        }
      } catch {
        setCityState(null);
      }
    };
    fetchCityState();
  }, [location]);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Update user location on login or dashboard load
  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.email &&
      navigator.geolocation
    ) {
      navigator.geolocation.getCurrentPosition((position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        fetch("/api/user/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: { type: "Point", coordinates: coords },
          }),
        });
      });
    }
  }, [status, session?.user?.email]);

  // Fetch friends (other halves) on mount
  useEffect(() => {
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const res = await fetch("/api/user/friends");
        if (res.ok) {
          const data = await res.json();
          setFriends(Array.isArray(data) ? data : []);
        } else {
          setFriends([]);
        }
      } catch {
        setFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };
    fetchFriends();
  }, []);

  // Fetch suggested other halves based on radius and location
  useEffect(() => {
    const fetchSuggested = async () => {
      if (suggestedMode === "nearby") {
        if (!location) return;
        try {
          let url = `/api/user/suggested?lat=${location.lat}&lng=${location.lng}&radius=${radius}`;
          if (selectedInterest) {
            url += `&interest=${encodeURIComponent(selectedInterest)}`;
          }
          const res = await fetch(url);
          const data = await res.json();
          setSuggested(Array.isArray(data) ? data : []);
        } catch {
          setSuggested([]);
        }
      } else if (suggestedMode === "interests") {
        try {
          const res = await fetch(`/api/user/suggested?mode=interests`);
          const data = await res.json();
          setSuggested(Array.isArray(data) ? data : []);
        } catch {
          setSuggested([]);
        }
      }
    };
    fetchSuggested();
  }, [location, radius, suggestedMode, selectedInterest]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">{t("dashboard.loading")}</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-primary">
      {/* Declare userId once for all post interactions */}
      {(() => {
        var userId = session?.user?.email || "";
        return null;
      })()}
      {/* Header with logo and user image */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center p-4 bg-primary shadow-sm">
        <div className="flex items-center w-full md:w-auto justify-between">
          <Link href="/dashboard">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </Link>
          {/* Hamburger menu for mobile */}
          <button
            className="md:hidden ml-2 p-2 rounded focus:outline-none border border-gray-300 bg-primary-dark text-secondary"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            aria-label="Open menu"
          >
            {/* Menu icon (three horizontal bars) */}
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
              <rect y="5" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="10" width="20" height="2" rx="1" fill="currentColor" />
              <rect y="15" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
        </div>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/chat"
            className="text-sm font-medium text-foreground hover:underline relative"
          >
            {t("dashboard.connectWithOtherHalves")}
            <NotificationDot className="-top-1 -right-1" />
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-foreground hover:underline"
          >
            {t("dashboard.settings")}
          </Link>
          {userProfile && (
            <Link href="/profile" className="flex items-center gap-2 group">
              <img
                src={userProfile.image || "/logo.png"}
                alt="User avatar"
                className="w-10 h-10 rounded-full border border-gray-300 shadow group-hover:opacity-80 transition"
                onError={(e) => {
                  e.currentTarget.src = "/logo.png";
                }}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
              <span className="text-foreground font-medium text-base group-hover:underline">
                {userProfile.name || t("dashboard.profile")}
              </span>
            </Link>
          )}
        </div>
        {/* Mobile dropdown menu */}
        {showMobileMenu && (
          <div className="flex flex-col gap-2 mt-4 md:hidden w-full">
            <LanguageSwitcher />
            <Link
              href="/chat"
              className="text-sm font-medium text-foreground hover:underline relative"
            >
              {t("dashboard.connectWithOtherHalves")}
              <NotificationDot className="-top-1 -right-1" />
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-foreground hover:underline"
            >
              {t("dashboard.settings")}
            </Link>
            {userProfile && (
              <Link href="/profile" className="flex items-center gap-2 group">
                <img
                  src={userProfile.image || "/logo.png"}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full border border-gray-300 shadow group-hover:opacity-80 transition"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.png";
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                <span className="text-foreground font-medium text-base group-hover:underline">
                  {userProfile.name || t("dashboard.profile")}
                </span>
              </Link>
            )}
          </div>
        )}
      </header>
      {/* Responsive dashboard layout */}
      <section className="flex flex-1 flex-col md:flex-row w-full max-w-7xl mx-auto p-2 md:p-8 gap-4 md:gap-8">
        {/* Left sidebar: Location, Other Halves and Suggested Other Halves */}
        <aside className="w-full md:w-1/3 flex flex-col gap-4 md:gap-8">
          {/* Location at the top */}
          <div className="bg-primary-dark rounded-lg shadow p-6 mb-2">
            {location && cityState && (
              <div className="text-sm mb-2">
                <span className="text-secondary">
                  {t("dashboard.location")}:{" "}
                </span>
                <span className="text-primary">{cityState}</span>
              </div>
            )}
            {location && !cityState && !locError && (
              <div className="text-sm text-primary mb-2">
                {t("dashboard.detectingLocation")}
              </div>
            )}
            {locError && (
              <div className="text-sm text-red-500 mb-2">{locError}</div>
            )}
          </div>
          {/* Other Halves (Friends) */}
          <div className="bg-primary-dark rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              {t("dashboard.otherHalves")}
            </h2>
            {loadingFriends ? (
              <div className="text-primary">{t("dashboard.loading")}</div>
            ) : friends.length === 0 ? (
              <p className="text-secondary">{t("dashboard.noOtherHalves")}</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li key={friend._id} className="flex items-center gap-4">
                    <img
                      src={friend.image || getRoboHashAvatar(friend._id)}
                      alt={friend.name || "Other Half"}
                      className="w-12 h-12 rounded-full border border-gray-300 object-cover"
                      onError={(e) => {
                        console.log(
                          `Failed to load friend image for ${friend.name}:`,
                          friend.image
                        );
                        // Try to fix Google image URL
                        const currentSrc = e.currentTarget.src;
                        if (
                          currentSrc.includes("googleusercontent.com") &&
                          !currentSrc.includes("referrer")
                        ) {
                          const newUrl = friend.image?.replace(
                            "=s96-c",
                            "=s96-c-rp-mo-br100"
                          );
                          if (newUrl && newUrl !== currentSrc) {
                            e.currentTarget.src = newUrl;
                            return;
                          }
                        }
                        e.currentTarget.src = getRoboHashAvatar(friend._id);
                      }}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                    <div>
                      <Link
                        href={`/profile/${encodeURIComponent(friend._id)}`}
                        className="font-bold text-lg text-secondary hover:underline focus:underline"
                      >
                        {friend.name || "Other Half"}
                      </Link>
                      <div className="text-sm text-primary">
                        {t("dashboard.interests")}:{" "}
                        {friend.interests && friend.interests.length > 0
                          ? friend.interests.join(", ")
                          : t("dashboard.noInterests")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Suggested Other Halves (real users, by radius) */}
          <div className="bg-primary-dark rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              {t("dashboard.suggestedOtherHalves")}
            </h2>
            {/* Show search radius selector for 'nearby' mode, interest filter for both modes */}
            <div className="mb-4 flex flex-wrap items-center gap-4">
              {suggestedMode === "nearby" && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="radius"
                    className="text-sm text-secondary font-medium"
                  >
                    {t("dashboard.searchRadius")}:
                  </label>
                  <select
                    id="radius"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="rounded border-gray-300 px-2 py-1 text-sm text-primary"
                  >
                    <option value={1}>1 {t("navigation.mile")}</option>
                    <option value={5}>5 {t("navigation.miles")}</option>
                    <option value={10}>10 {t("navigation.miles")}</option>
                    <option value={25}>25 {t("navigation.miles")}</option>
                    <option value={50}>50 {t("navigation.miles")}</option>
                    <option value={100}>100 {t("navigation.miles")}</option>
                  </select>
                </div>
              )}
              {userProfile?.interests && userProfile.interests.length > 0 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="interest"
                    className="text-sm text-secondary font-medium"
                  >
                    {t("dashboard.filterByInterest") !==
                    "dashboard.filterByInterest"
                      ? t("dashboard.filterByInterest")
                      : "Filter by interest:"}
                  </label>
                  <select
                    id="interest"
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(e.target.value)}
                    className="rounded border-gray-300 px-2 py-1 text-sm text-primary"
                  >
                    <option value="">
                      {t("dashboard.anyInterest") !== "dashboard.anyInterest"
                        ? t("dashboard.anyInterest")
                        : "Any interest"}
                    </option>
                    {userProfile.interests.map((interest: string) => (
                      <option key={interest} value={interest}>
                        {interest}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* Search mode selector - segmented control style */}
            <div className="mb-4 flex flex-col gap-2">
              <span className="text-sm text-secondary font-medium mb-1">
                {t("dashboard.suggestedSearchMode") !==
                "dashboard.suggestedSearchMode"
                  ? t("dashboard.suggestedSearchMode")
                  : "Find other halves by:"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-all
                    ${
                      suggestedMode === "nearby"
                        ? "bg-secondary-dark border-secondary-dark text-white shadow"
                        : "bg-gray-100 border-gray-300 text-gray-600"
                    }
                  `}
                  onClick={() => setSuggestedMode("nearby")}
                  aria-pressed={suggestedMode === "nearby"}
                >
                  <span role="img" aria-label="Nearby">
                    📍
                  </span>
                  {t("dashboard.searchNearby") !== "dashboard.searchNearby"
                    ? t("dashboard.searchNearby")
                    : "Nearby"}
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-all
                    ${
                      suggestedMode === "interests"
                        ? "bg-secondary-dark border-secondary-dark text-white shadow"
                        : "bg-gray-100 border-gray-300 text-gray-600"
                    }
                  `}
                  onClick={() => setSuggestedMode("interests")}
                  aria-pressed={suggestedMode === "interests"}
                >
                  <span role="img" aria-label="Interests">
                    💡
                  </span>
                  {t("dashboard.searchInterests") !==
                  "dashboard.searchInterests"
                    ? t("dashboard.searchInterests")
                    : "Similar Interests"}
                </button>
              </div>
            </div>
            {suggested.length === 0 ? (
              <p className="text-secondary">{t("dashboard.noSuggestions")}</p>
            ) : (
              <ul className="space-y-4">
                {(suggestedMode === "interests"
                  ? [...suggested]
                      .filter(
                        (user) =>
                          user.matchType === "interests" &&
                          Array.isArray(user.sharedInterests) &&
                          user.sharedInterests.length > 0
                      )
                      .sort(
                        (a, b) =>
                          (b.sharedInterests?.length || 0) -
                          (a.sharedInterests?.length || 0)
                      )
                  : [...suggested]
                )
                  .filter((user) =>
                    selectedInterest
                      ? Array.isArray(user.interests) &&
                        user.interests.includes(selectedInterest)
                      : true
                  )
                  .map((user) => {
                    // ...existing code for rendering user card...
                    return (
                      <li key={user._id} className="flex items-center gap-4">
                        <img
                          src={user.image || getRoboHashAvatar(user._id)}
                          alt={user.name || user.email}
                          className="w-12 h-12 rounded-full border border-gray-300"
                          onError={(e) => {
                            // ...existing error handling...
                            const currentSrc = e.currentTarget.src;
                            if (
                              currentSrc.includes("googleusercontent.com") &&
                              !currentSrc.includes("referrer")
                            ) {
                              const newUrl = user.image?.replace(
                                "=s96-c",
                                "=s96-c-rp-mo-br100"
                              );
                              if (newUrl && newUrl !== currentSrc) {
                                e.currentTarget.src = newUrl;
                                return;
                              }
                            }
                            e.currentTarget.src = getRoboHashAvatar(user._id);
                          }}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                        />
                        <div>
                          <Link
                            href={`/profile/${encodeURIComponent(user._id)}`}
                            className="font-bold text-lg text-secondary hover:underline focus:underline"
                          >
                            {user.name || user.email}
                          </Link>
                          <div className="text-sm text-primary">
                            {user.matchType === "interests" &&
                            user.sharedInterests ? (
                              <>
                                {t("dashboard.sharedInterests")}:{" "}
                                {user.sharedInterests.join(", ")}
                              </>
                            ) : user.interests && user.interests.length > 0 ? (
                              <>
                                {t("dashboard.interests")}:{" "}
                                {user.interests.join(", ")}
                              </>
                            ) : (
                              <>{t("dashboard.noInterestsListed")}</>
                            )}
                          </div>
                          {user.distance != null && (
                            <div className="text-xs text-primary mt-1">
                              {user.distance.toFixed(1)}{" "}
                              {t("dashboard.milesAway")}
                            </div>
                          )}
                          {user.matchType && (
                            <div className="text-xs text-accent mt-1">
                              {user.matchType === "location"
                                ? t("dashboard.nearbyMatch")
                                : user.matchType === "interests"
                                ? t("dashboard.interestMatch")
                                : "🔍 Discover"}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </aside>
        {/* Right column: Media Feed */}
        <section className="flex-1 flex flex-col gap-4 md:gap-6">
          {/* Welcome */}
          <h1 className="text-4xl font-bold mb-2">{t("dashboard.title")}</h1>

          {/* Media Feed Post Form */}
          <div className="bg-primary-dark rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-2 text-primary">
              {t("dashboard.postToFeed")}
            </h2>
            <form
              className="flex flex-col gap-3 relative"
              onSubmit={handlePostSubmit}
            >
              <div className="flex gap-2 items-center">
                <textarea
                  className="border text-secondary border-gray-300 rounded p-2 resize-none min-h-[60px] flex-1"
                  placeholder={t("dashboard.whatsOnMind")}
                  name="message"
                  rows={3}
                  disabled={posting}
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-gray-200 text-primary rounded px-2 py-1 text-sm font-medium border hover:bg-gray-300"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPostEmojiPicker((v) => !v);
                  }}
                  style={{ minWidth: 32 }}
                >
                  😊
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-primary rounded px-2 py-1 text-sm font-medium border hover:bg-gray-300"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowPostGifPicker((v) => !v);
                  }}
                  style={{ minWidth: 32 }}
                >
                  GIF
                </button>
                {showPostEmojiPicker && (
                  <div className="absolute z-50 top-full left-0 mt-2">
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setPostInput((prev) => prev + emoji);
                        setShowPostEmojiPicker(false);
                      }}
                    />
                  </div>
                )}
                {showPostGifPicker && (
                  <div className="absolute z-50 top-full left-20 mt-2">
                    <GifPicker
                      onSelect={(gifUrl) => {
                        setPostGifUrl(gifUrl);
                        setShowPostGifPicker(false);
                      }}
                    />
                  </div>
                )}
              </div>
              {postGifUrl && (
                <img
                  src={postGifUrl}
                  alt="GIF"
                  className="max-w-xs max-h-40 rounded border mb-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="border border-gray-300 rounded p-2"
                name="image"
                disabled={posting}
              />
              <button
                type="submit"
                className="bg-primary text-white rounded px-4 py-2 font-medium hover:bg-primary-dark disabled:opacity-60"
                disabled={posting}
              >
                {posting ? t("dashboard.posting") : t("dashboard.post")}
              </button>
              {postError && (
                <div className="text-red-500 text-sm">{postError}</div>
              )}
            </form>
          </div>
          {/* ...removed Other Halves' Feed section (now merged with main feed)... */}

          {/* Media Feed List */}
          {/* Declare userId once for all post interactions */}
          <div className="flex flex-col gap-4">
            {loadingPosts ? (
              <div className="text-primary-dark">
                {t("dashboard.loadingFeed")}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-primary-dark">{t("dashboard.noPosts")}</div>
            ) : (
              posts.map((post) => {
                const userId = session?.user?.email || "";
                const user = userMap?.[post.userId];
                // Like/dislike helpers
                const liked = post.likes?.includes(userId);
                const disliked = post.dislikes?.includes(userId);
                const likeCount = post.likes?.length || 0;
                const dislikeCount = post.dislikes?.length || 0;

                const handleLike = async (postId: string) => {
                  setLikeLoading(postId);
                  try {
                    let res;
                    if (liked) {
                      res = await fetch(`/api/feed/unlike`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId }),
                      });
                    } else {
                      res = await fetch(`/api/feed/like`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId }),
                      });
                    }
                    if (res.ok) {
                      fetchPosts();
                    }
                  } finally {
                    setLikeLoading(null);
                  }
                };
                const handleDislike = async (postId: string) => {
                  setDislikeLoading(postId);
                  try {
                    let res;
                    if (disliked) {
                      res = await fetch(`/api/feed/undislike`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId }),
                      });
                    } else {
                      res = await fetch(`/api/feed/dislike`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ postId }),
                      });
                    }
                    if (res.ok) {
                      fetchPosts();
                    }
                  } finally {
                    setDislikeLoading(null);
                  }
                };
                const handleCommentSubmit = async (
                  e: React.FormEvent,
                  postId: string
                ) => {
                  e.preventDefault();
                  setCommentLoading(postId);
                  try {
                    const message = commentInputs[postId] || "";
                    const gifUrl = commentGifUrls[postId] || "";
                    // Only submit if message or gifUrl is present
                    if (!message && !gifUrl) {
                      setCommentLoading(null);
                      return;
                    }
                    await fetch(`/api/feed/comment`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        postId,
                        message,
                        gifUrl,
                      }),
                    });
                    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
                    setCommentGifUrls((prev) => ({ ...prev, [postId]: "" }));
                    fetchPosts();
                  } finally {
                    setCommentLoading(null);
                  }
                };

                return (
                  <div
                    key={post._id}
                    className="bg-primary-dark rounded-lg shadow p-4 flex flex-col w-full gap-2"
                  >
                    <img
                      src={
                        user?.image && user?.image.trim() !== ""
                          ? user.image
                          : post.userImage && post.userImage.trim() !== ""
                          ? post.userImage
                          : getRoboHashAvatar(post.userId)
                      }
                      alt={user?.name || post.userName || "User"}
                      className="w-12 h-12 rounded-full border border-gray-300 object-cover mb-2"
                      onError={(e) => {
                        e.currentTarget.src = getRoboHashAvatar(post.userId);
                      }}
                    />
                    <div className="w-full">
                      <div className="font-bold text-secondary-dark break-words w-full">
                        {user?.name || post.userName || t("dashboard.user")}
                      </div>
                      <div className="text-primary mb-2 break-words">
                        <div className="text-primary mb-2 break-words w-full">
                          {post.message}
                        </div>
                        {/* Render GIF if present in post */}
                        {post.gifUrl && post.gifUrl.length > 0 && (
                          <img
                            src={post.gifUrl}
                            alt="GIF"
                            className="w-full max-h-60 rounded-lg mt-2 object-contain cursor-pointer hover:opacity-80 transition"
                            onClick={() => setModalImage(post.gifUrl ?? null)}
                          />
                        )}
                        {post.imageUrl && (
                          <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="w-full max-h-60 rounded-lg mt-2 object-contain cursor-pointer hover:opacity-80 transition"
                            onClick={() => setModalImage(post.imageUrl ?? null)}
                          />
                        )}
                        {/* Like/Dislike Buttons */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex flex-row flex-wrap w-full gap-2 mb-2">
                            <button
                              className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-2 ${
                                liked
                                  ? "bg-primary text-white"
                                  : "bg-gray-200 text-primary"
                              }`}
                              disabled={likeLoading === post._id}
                              onClick={() => handleLike(post._id)}
                            >
                              <FaThumbsUp className="inline-block" />{" "}
                              {likeCount}
                            </button>
                            <button
                              className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-2 ${
                                disliked
                                  ? "bg-secondary-dark text-white"
                                  : "bg-gray-200 text-primary"
                              }`}
                              disabled={dislikeLoading === post._id}
                              onClick={() => handleDislike(post._id)}
                            >
                              <FaThumbsDown className="inline-block" />{" "}
                              {dislikeCount}
                            </button>
                          </div>
                        </div>
                        {/* Comments Section */}
                        <div className="mt-4">
                          <div className="font-semibold text-primary mb-2">
                            Comments
                          </div>
                          <ul className="space-y-2 mb-2 w-full">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map((comment) => (
                                <li
                                  key={comment._id}
                                  className="text-sm bg-primary-dark rounded p-2 border border-primary w-full break-words"
                                >
                                  <span className="font-bold text-secondary-dark">
                                    {comment.userName || comment.userId}:
                                  </span>{" "}
                                  <span className="text-primary">
                                    {comment.message}
                                  </span>
                                  {comment.gifUrl &&
                                    comment.gifUrl.length > 0 && (
                                      <img
                                        src={comment.gifUrl}
                                        alt="GIF"
                                        className="w-full max-w-xs max-h-32 rounded border mt-2 object-cover"
                                      />
                                    )}
                                  <span className="text-xs text-gray-500 ml-2">
                                    {comment.createdAt
                                      ? new Date(
                                          comment.createdAt
                                        ).toLocaleString()
                                      : ""}
                                  </span>
                                </li>
                              ))
                            ) : (
                              <li className="text-sm text-primary w-full">
                                No comments yet.
                              </li>
                            )}
                          </ul>
                          <form
                            className="flex flex-col gap-2 items-center relative"
                            onSubmit={(e) => handleCommentSubmit(e, post._id)}
                          >
                            <input
                              type="text"
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-full text-secondary"
                              placeholder="Add a comment or just a GIF..."
                              value={commentInputs[post._id] || ""}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post._id]: e.target.value,
                                }))
                              }
                              disabled={commentLoading === post._id}
                            />
                            <div className="flex flex-row flex-wrap w-full gap-2 mt-2">
                              <button
                                type="button"
                                className="bg-gray-200 text-primary rounded px-2 py-1 text-sm font-medium border hover:bg-gray-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowEmojiPicker((prev) => ({
                                    ...(prev || {}),
                                    [post._id]: !prev?.[post._id],
                                  }));
                                }}
                                style={{ minWidth: 32 }}
                              >
                                😊
                              </button>
                              <button
                                type="button"
                                className="bg-gray-200 text-primary rounded px-2 py-1 text-sm font-medium border hover:bg-gray-300"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowGifPicker((prev) => ({
                                    ...prev,
                                    [post._id]: !prev[post._id],
                                  }));
                                }}
                                style={{ minWidth: 32 }}
                              >
                                GIF
                              </button>
                              {commentGifUrls[post._id] && (
                                <img
                                  src={commentGifUrls[post._id]}
                                  alt="GIF preview"
                                  className="max-w-xs max-h-20 rounded border ml-2"
                                />
                              )}
                              {showEmojiPicker?.[post._id] && (
                                <div className="absolute z-50 top-full left-0 mt-2">
                                  <EmojiPicker
                                    onSelect={(emoji) => {
                                      setCommentInputs((prev) => ({
                                        ...prev,
                                        [post._id]:
                                          (prev[post._id] || "") + emoji,
                                      }));
                                      setShowEmojiPicker((prev) => ({
                                        ...prev,
                                        [post._id]: false,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                              {showGifPicker?.[post._id] && (
                                <div className="absolute z-50 top-full left-20 mt-2">
                                  <GifPicker
                                    onSelect={(gifUrl) => {
                                      setCommentGifUrls((prev) => ({
                                        ...prev,
                                        [post._id]: gifUrl,
                                      }));
                                      setShowGifPicker((prev) => ({
                                        ...prev,
                                        [post._id]: false,
                                      }));
                                    }}
                                  />
                                </div>
                              )}
                              <button
                                type="submit"
                                className="bg-primary text-white rounded px-3 py-1 text-sm font-medium border hover:bg-primary-dark"
                                disabled={
                                  commentLoading === post._id ||
                                  (!commentInputs[post._id] &&
                                    !commentGifUrls[post._id])
                                }
                              >
                                {commentLoading === post._id
                                  ? "Posting..."
                                  : "Post"}
                              </button>
                            </div>
                          </form>
                        </div>
                        <div className="text-xs text-primary mt-1">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Modal for viewing images */}
          {modalImage && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
              <div className="relative max-w-3xl w-full flex flex-col items-center">
                <button
                  className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-50 rounded-full px-3 py-1 hover:bg-opacity-80"
                  onClick={() => setModalImage(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <img
                  src={modalImage || ""}
                  alt="Full size post image"
                  className="rounded-lg border max-h-[80vh] max-w-full shadow-lg"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
