import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";

// GET /api/user/otherhalves
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Find current user
  const me = await User.findOne({ email: session.user.email });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Find users from the friends array
  interface OtherHalf {
    _id: string;
    name: string;
    image?: string;
  }

  let otherHalves: OtherHalf[] = [];
  if (Array.isArray(me.friends) && me.friends.length > 0) {
    const users = await User.find({ _id: { $in: me.friends } })
      .select("_id name image")
      .lean();
    otherHalves = users.map((user) => ({
      _id: user._id?.toString?.() ?? String(user._id),
      name: user.name ?? "Unknown User",
      image: user.image as string | undefined,
    }));
  }
  return NextResponse.json(otherHalves);
}
