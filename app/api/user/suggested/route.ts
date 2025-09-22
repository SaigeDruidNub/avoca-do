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

  // Find users within radius, excluding self and friends
  const userEmail = session?.user?.email;
  let excludeIds: string[] = [];
  if (userEmail) {
    let me = await User.findOne({ email: userEmail }).lean();
    // Defensive: if me is an array, use first element
    if (Array.isArray(me)) me = me[0];
    if (me && me.friends && Array.isArray(me.friends)) {
      excludeIds = me.friends.map(String);
    }
    // Also exclude self
    if (me && me._id) excludeIds.push(String(me._id));
  }
  const users = await User.find({
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius * 1609.34, // miles to meters
      },
    },
    ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {}),
  }).lean();

  // Add distance field for UI
  // Removed unused UserWithLocation interface
  const suggested = users.map((u) => {
    const userLat = (u.location?.coordinates?.[1] as number) || 0;
    const userLng = (u.location?.coordinates?.[0] as number) || 0;
    return {
      ...u,
      _id: String(u._id),
      distance: getDistance(lat, lng, userLat, userLng),
    };
  });

  return NextResponse.json(suggested);
}
