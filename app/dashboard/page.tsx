"use client";
import React, { useState, useEffect as useReactEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
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
  }
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);

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
    createdAt?: string;
  };
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [userMap, setUserMap] = useState<Record<
    string,
    { name: string; image?: string }
  > | null>(null);

  // Post submit handler
  async function handlePostSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
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

  // Fetch posts on mount
  useEffect(() => {
    fetchPosts();
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

  // Remove handleGetLocation, always update location on mount
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
        () => {
          setLocError("Unable to retrieve your location.");
        }
      );
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
      if (!location) return;
      try {
        const res = await fetch(
          `/api/user/suggested?lat=${location.lat}&lng=${location.lng}&radius=${radius}`
        );
        const data = await res.json();
        setSuggested(Array.isArray(data) ? data : []);
      } catch {
        setSuggested([]);
      }
    };
    fetchSuggested();
  }, [location, radius]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </main>
    );
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
            href="/settings"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Settings
          </Link>
          {session?.user && (
            <Link href="/profile" className="flex items-center gap-2 group">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full border border-gray-300 shadow group-hover:opacity-80 transition"
                />
              )}
              <span className="text-primary font-medium text-base group-hover:underline">
                {session.user.name || "Profile"}
              </span>
            </Link>
          )}
        </div>
      </header>
      {/* Two-column dashboard layout */}
      <section className="flex flex-1 flex-row w-full max-w-7xl mx-auto p-8 gap-8">
        {/* Left sidebar: Location, Other Halves and Suggested Other Halves */}
        <aside className="w-full md:w-1/3 flex flex-col gap-8">
          {/* Location and search radius at the top */}
          <div className="bg-primary-dark rounded-lg shadow p-6 mb-2">
            <div className="mb-2 flex items-center gap-2">
              <label
                htmlFor="radius"
                className="text-sm text-primary font-medium"
              >
                Search radius:
              </label>
              <select
                id="radius"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="rounded border-gray-300 px-2 py-1 text-sm text-primary"
              >
                <option value={1}>1 mile</option>
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
              </select>
            </div>
            {location && cityState && (
              <div className="text-sm text-primary">
                {`Your location: ${cityState}`}
              </div>
            )}
            {location && !cityState && !locError && (
              <div className="text-sm text-primary">
                Detecting your city and state...
              </div>
            )}
            {locError && <div className="text-sm text-red-500">{locError}</div>}
          </div>
          {/* Other Halves (Friends) */}
          <div className="bg-primary-dark rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Your Other Halves
            </h2>
            {loadingFriends ? (
              <div className="text-primary">Loading...</div>
            ) : friends.length === 0 ? (
              <p className="text-foreground">You have no other halves yet.</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li key={friend._id} className="flex items-center gap-4">
                    <img
                      src={friend.image || "/logo.png"}
                      alt={friend.name || "Other Half"}
                      className="w-12 h-12 rounded-full border border-gray-300"
                    />
                    <div>
                      <Link
                        href={`/profile/${encodeURIComponent(friend._id)}`}
                        className="font-medium text-lg text-primary hover:underline focus:underline"
                      >
                        {friend.name || "Other Half"}
                      </Link>
                      <div className="text-sm text-primary">
                        Interests:{" "}
                        {friend.interests && friend.interests.length > 0
                          ? friend.interests.join(", ")
                          : "None"}
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
              Suggested Other Halves
            </h2>
            {suggested.length === 0 ? (
              <p className="text-foreground">No suggestions at this time.</p>
            ) : (
              <ul className="space-y-4">
                {suggested.map((user) => (
                  <li key={user._id} className="flex items-center gap-4">
                    <img
                      src={user.image || "/logo.png"}
                      alt={user.name || user.email}
                      className="w-12 h-12 rounded-full border border-gray-300"
                    />
                    <div>
                      <Link
                        href={`/profile/${encodeURIComponent(user._id)}`}
                        className="font-medium text-lg text-primary hover:underline focus:underline"
                      >
                        {user.name || user.email}
                      </Link>
                      <div className="text-sm text-primary">
                        {user.interests && user.interests.length > 0 ? (
                          <>Interests: {user.interests.join(", ")}</>
                        ) : (
                          <>No interests listed</>
                        )}
                      </div>
                      {user.distance != null && (
                        <div className="text-xs text-primary mt-1">
                          {user.distance.toFixed(1)} miles away
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        {/* Right column: Media Feed */}
        <section className="flex-1 flex flex-col gap-6">
          {/* Welcome */}
          <h1 className="text-4xl font-bold mb-2">
            Welcome to your Dashboard!
          </h1>

          {/* Media Feed Post Form */}
          <div className="bg-primary-dark rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-2 text-primary">
              Post to your feed
            </h2>
            <form className="flex flex-col gap-3" onSubmit={handlePostSubmit}>
              <textarea
                className="border text-primary border-gray-300 rounded p-2 resize-none min-h-[60px]"
                placeholder="What's on your mind?"
                name="message"
                rows={3}
                required
                disabled={posting}
              />
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
                {posting ? "Posting..." : "Post"}
              </button>
              {postError && (
                <div className="text-red-500 text-sm">{postError}</div>
              )}
            </form>
          </div>
          {/* ...removed Other Halves' Feed section (now merged with main feed)... */}

          {/* Media Feed List */}
          <div className="flex flex-col gap-4">
            {loadingPosts ? (
              <div className="text-primary-dark">Loading feed...</div>
            ) : posts.length === 0 ? (
              <div className="text-primary-dark">
                No posts yet. Be the first to post!
              </div>
            ) : (
              posts.map((post) => {
                const user = userMap?.[post.userId];
                return (
                  <div
                    key={post._id}
                    className="bg-primary-dark rounded-lg shadow p-4 flex gap-4 items-start"
                  >
                    <img
                      src={user?.image || post.userImage || "/logo.png"}
                      alt={user?.name || post.userName || "User"}
                      className="w-12 h-12 rounded-full border border-gray-300"
                    />
                    <div>
                      <div className="font-bold text-primary">
                        {user?.name || post.userName || "User"}
                      </div>
                      <div className="text-primary mb-2">{post.message}</div>
                      {post.imageUrl && (
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="max-w-xs max-h-60 rounded-lg border mt-2 object-contain cursor-pointer hover:opacity-80 transition"
                          style={{ width: "100%", height: "auto" }}
                          onClick={() => setModalImage(post.imageUrl ?? null)}
                        />
                      )}
                      {/* Image Modal */}
                      {modalImage && (
                        <div
                          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
                          onClick={() => setModalImage(null)}
                        >
                          <div
                            className="relative max-w-3xl w-full flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="absolute top-2 right-2 text-white text-2xl bg-black bg-opacity-50 rounded-full px-3 py-1 hover:bg-opacity-80"
                              onClick={() => setModalImage(null)}
                              aria-label="Close"
                            >
                              &times;
                            </button>
                            <img
                              src={modalImage}
                              alt="Full size post image"
                              className="rounded-lg border max-h-[80vh] max-w-full shadow-lg"
                              style={{ objectFit: "contain" }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-primary mt-1">
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
