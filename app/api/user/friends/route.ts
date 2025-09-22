// GET /api/user/friends
export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let me = await UserModel.findOne({ email: session.user.email }).lean();
  if (Array.isArray(me)) me = me[0];
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Find all users whose _id is in my friends array
  const friends = await UserModel.find({
    _id: { $in: me.friends || [] },
  }).lean();
  // Return basic info for each friend
  const result = friends.map((u) => ({
    _id: String(u._id),
    name: u.name,
    email: u.email,
    image: u.image,
    pronouns: u.pronouns,
    maritalStatus: u.maritalStatus,
    job: u.job,
    school: u.school,
    about: u.about,
    interests: u.interests,
    location: u.location,
  }));
  return NextResponse.json(result);
}
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/user/friends
// Body: { friendId: string }
export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { friendId } = await req.json();
  if (!friendId) {
    return NextResponse.json({ error: "Missing friendId" }, { status: 400 });
  }
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.friends.includes(friendId)) {
    return NextResponse.json({ message: "Already friends" });
  }
  user.friends.push(friendId);
  await user.save();
  return NextResponse.json({ message: "Friend added" });
}
