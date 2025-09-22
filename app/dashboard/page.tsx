"use client";
import React, { useMemo, useState, useEffect as useReactEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  // Modal state for viewing images
  const [modalImage, setModalImage] = useState<string | null>(null);
  // Media feed state
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Fetch posts on mount
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch("/api/feed");
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  // Handle post submit
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
  const postsRes = await fetch("/api/feed");
  const data = await postsRes.json();
  setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setPostError("Failed to post");
    } finally {
      setPosting(false);
    }
  }
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
        (error) => {
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
      } catch (e) {
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

  // Mock data for demonstration
  const userInterests = [
    "Music",
    "Art",
    "Technology",
    "Travel",
    "Fitness",
    "Movies",
  ];
  const friends = [
    {
      name: "Alex Kim",
      image: `https://robohash.org/${encodeURIComponent(
        "Alex Kim"
      )}?set=set4&size=80x80`,
      interests: ["Music", "Travel", "Movies"],
    },
    {
      name: "Sam Lee",
      image: `https://robohash.org/${encodeURIComponent(
        "Sam Lee"
      )}?set=set4&size=80x80`,
      interests: ["Technology", "Fitness"],
    },
  ];
  const allUsers = [
    {
      name: "Jordan Smith",
      image: `https://robohash.org/${encodeURIComponent(
        "Jordan Smith"
      )}?set=set4&size=80x80`,
      interests: ["Music", "Art", "Gaming"],
    },
    {
      name: "Taylor Brooks",
      image: `https://robohash.org/${encodeURIComponent(
        "Taylor Brooks"
      )}?set=set4&size=80x80`,
      interests: ["Travel", "Cooking", "Movies"],
    },
    {
      name: "Morgan Ray",
      image: `https://robohash.org/${encodeURIComponent(
        "Morgan Ray"
      )}?set=set4&size=80x80`,
      interests: ["Fitness", "Technology", "Art"],
    },
    {
      name: "Jamie Fox",
      image: `https://robohash.org/${encodeURIComponent(
        "Jamie Fox"
      )}?set=set4&size=80x80`,
      interests: ["Movies", "Art"],
    },
  ];
  // Filter out friends and suggest users with most shared interests
  const friendNames = friends.map((f) => f.name);
  const suggested = useMemo(() => {
    return allUsers
      .filter((u) => !friendNames.includes(u.name))
      .map((u) => ({
        ...u,
        common: u.interests.filter((i) => userInterests.includes(i)),
      }))
      .sort((a, b) => b.common.length - a.common.length)
      .slice(0, 3);
  }, [allUsers, friendNames, userInterests]);

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
            {friends.length === 0 ? (
              <p className="text-foreground">You have no other halves yet.</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li key={friend.name} className="flex items-center gap-4">
                    <img
                      src={friend.image}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full border border-gray-300"
                    />
                    <div>
                      <Link
                        href={`/profile/${encodeURIComponent(friend.name)}`}
                        className="font-medium text-lg text-primary hover:underline focus:underline"
                      >
                        {friend.name}
                      </Link>
                      <div className="text-sm text-foreground">
                        Interests: {friend.interests.join(", ")}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Suggested Other Halves */}
          <div className="bg-primary-dark rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-primary">
              Suggested Other Halves
            </h2>
            {suggested.length === 0 ? (
              <p className="text-foreground">No suggestions at this time.</p>
            ) : (
              <ul className="space-y-4">
                {suggested.map((user) => (
                  <li key={user.name} className="flex items-center gap-4">
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-12 h-12 rounded-full border border-gray-300"
                    />
                    <div>
                      <Link
                        href={`/profile/${encodeURIComponent(user.name)}`}
                        className="font-medium text-lg text-primary hover:underline focus:underline"
                      >
                        {user.name}
                      </Link>
                      <div className="text-sm text-foreground">
                        Shared interests: {user.common.join(", ")}
                      </div>
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
          {/* Media Feed List */}
          <div className="flex flex-col gap-4">
            {loadingPosts ? (
              <div className="text-primary">Loading feed...</div>
            ) : posts.length === 0 ? (
              <div className="text-primary">
                No posts yet. Be the first to post!
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-primary-dark rounded-lg shadow p-4 flex gap-4 items-start"
                >
                  <img
                    src={post.userImage || "/logo.png"}
                    alt={post.userName || "User"}
                    className="w-12 h-12 rounded-full border border-gray-300"
                  />
                  <div>
                    <div className="font-bold text-primary">
                      {post.userName || "User"}
                    </div>
                    <div className="text-primary mb-2">{post.message}</div>
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post image"
                        className="max-w-xs max-h-60 rounded-lg border mt-2 object-contain cursor-pointer hover:opacity-80 transition"
                        style={{ width: "100%", height: "auto" }}
                        onClick={() => setModalImage(post.imageUrl)}
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
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
