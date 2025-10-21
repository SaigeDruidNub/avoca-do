import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { location } = await req.json();
  if (
    !location ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return NextResponse.json({ error: "Invalid location" }, { status: 400 });
  }
  await dbConnect();
  await User.updateOne(
    { email: session.user.email },
    { $set: { location, locationShared: true } }
  );
  return NextResponse.json({ success: true });
}
