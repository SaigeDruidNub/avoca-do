import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";

// Haversine formula for distance in miles
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const interest = searchParams.get("interest") || "";

  // Find current user and get exclude IDs
  const userEmail = session?.user?.email;
  let excludeIds: string[] = [];
  let currentUser: {
    _id?: unknown;
    friends?: unknown[];
    blocked?: unknown[];
    interests?: string[];
    [key: string]: unknown;
  } | null = null;

  if (userEmail) {
    const foundUser = await User.findOne({ email: userEmail }).lean();
    if (Array.isArray(foundUser)) {
      currentUser = foundUser[0] ?? null;
    } else {
      currentUser = foundUser;
    }
    if (
      currentUser &&
      currentUser.friends &&
      Array.isArray(currentUser.friends)
    ) {
      excludeIds = currentUser.friends.map(String);
    }
    // Also exclude self
    if (currentUser && currentUser._id)
      excludeIds.push(currentUser._id?.toString?.() ?? String(currentUser._id));

    // Exclude users that the current user has blocked
    if (
      currentUser &&
      currentUser.blocked &&
      Array.isArray(currentUser.blocked)
    ) {
      excludeIds.push(...currentUser.blocked.map(String));
    }

    // Find and exclude users who have blocked the current user
    if (currentUser && currentUser._id) {
      const usersWhoBlockedMe = await User.find({
        blocked: currentUser._id?.toString?.() ?? String(currentUser._id),
      })
        .select("_id")
        .lean();

      const blockedByIds: string[] = usersWhoBlockedMe.map(
        (u) => u._id?.toString?.() ?? String(u._id)
      );
      excludeIds.push(...blockedByIds);
    }
  }

  type SuggestedUser = {
    _id: string;
    name?: string;
    image?: string;
    location?: { coordinates?: [number, number] };
    interests?: string[];
    blocked?: string[];
    friends?: string[];
    sharedInterests?: string[];
    distance?: number | null;
    matchType?: "location" | "interests" | "fallback";
  };
  let locationBasedUsers: SuggestedUser[] = [];
  let interestBasedUsers: SuggestedUser[] = [];
  let suggested: SuggestedUser[] = [];

  // 1. Try location-based matching first (for users who have shared location)
  if (lat !== 0 || lng !== 0) {
    try {
      const query: Record<string, unknown> = {
        $and: [
          {
            $or: [
              { locationShared: true },
              { locationShared: { $exists: false } },
            ],
          },
          {
            $or: [
              { "privacy.onlyDiscoverableByEmail": { $exists: false } },
              { "privacy.onlyDiscoverableByEmail": false },
            ],
          },
        ],
        location: {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: radius * 1609.34,
          },
        },
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
      };
      if (interest) {
        query.interests = { $in: [interest] };
      }
      locationBasedUsers = (await User.find(query).lean()).map((u) => ({
        ...u,
        _id: u._id?.toString?.() ?? String(u._id),
      }));
    } catch (error) {
      locationBasedUsers = [];
    }
  }

  // 2. Interest-based matching for users with shared interests (regardless of locationShared)
  if (
    currentUser &&
    currentUser.interests &&
    Array.isArray(currentUser.interests) &&
    currentUser.interests.length > 0
  ) {
    interestBasedUsers = (
      await User.find({
        interests: { $in: currentUser.interests },
        $or: [
          { "privacy.onlyDiscoverableByEmail": { $exists: false } },
          { "privacy.onlyDiscoverableByEmail": false },
        ],
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
      }).lean()
    ).map((u) => ({
      ...u,
      _id: u._id?.toString?.() ?? String(u._id),
    }));

    // Sort by number of shared interests descending
    interestBasedUsers = interestBasedUsers
      .map((u) => {
        const sharedInterests = Array.isArray(currentUser?.interests)
          ? currentUser.interests.filter((interest: string) =>
              u.interests?.includes(interest)
            )
          : [];
        return { ...u, sharedInterests };
      })
      .filter((u) => u.sharedInterests.length > 0)
      .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length);
  }

  // 3. Combine and format results
  const locationResults = locationBasedUsers.map((u) => {
    const userLat = (u.location?.coordinates?.[1] as number) || 0;
    const userLng = (u.location?.coordinates?.[0] as number) || 0;
    return {
      ...u,
      _id: String(u._id),
      distance: getDistance(lat, lng, userLat, userLng) ?? 0,
      matchType: "location" as const,
      sharedInterests: u.sharedInterests ?? [],
    };
  });

  const interestResults = interestBasedUsers.map((u) => {
    const sharedInterests =
      currentUser?.interests?.filter((interest: string) =>
        u.interests?.includes(interest)
      ) || [];
    return {
      ...u,
      _id: String(u._id),
      distance: null,
      matchType: "interests" as const,
      sharedInterests: sharedInterests,
    };
  });

  // 4. Remove duplicates (users who appear in both lists) - prioritize location matches
  const locationUserIds = new Set(locationResults.map((u) => u._id));
  const uniqueInterestResults = interestResults.filter(
    (u) => !locationUserIds.has(u._id)
  );

  // 5. Combine results with location matches first, then interest matches
  suggested = [...locationResults, ...uniqueInterestResults];

  // 6. Fallback: if no results found, get some random users (excluding friends and self)
  if (suggested.length === 0 && userEmail) {
    try {
      const fallbackUsers = await User.find({
        $or: [
          { "privacy.onlyDiscoverableByEmail": { $exists: false } },
          { "privacy.onlyDiscoverableByEmail": false },
        ],
        ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
      })
        .limit(5)
        .lean();

      const fallbackResults: SuggestedUser[] = fallbackUsers.map((u) => ({
        ...u,
        _id: u._id?.toString?.() ?? String(u._id),
        distance: null,
        matchType: "fallback" as const,
        sharedInterests: [],
      }));
      suggested = fallbackResults;
    } catch (error) {}
  }

  return NextResponse.json(suggested);
}
