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
import { authOptions } from "@/lib/authOptions";

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

  // Check if the user is trying to add themselves
  if (String(user._id) === friendId) {
    return NextResponse.json(
      { error: "Cannot add yourself as other half" },
      { status: 400 }
    );
  }

  // Find the target user to check if they exist and their blocked status
  const targetUser = await UserModel.findById(friendId);
  if (!targetUser) {
    return NextResponse.json(
      { error: "Target user not found" },
      { status: 404 }
    );
  }

  // Check if current user has blocked the target user
  const currentUserBlocked = Array.isArray(user.blocked) ? user.blocked : [];
  if (currentUserBlocked.includes(friendId)) {
    return NextResponse.json(
      { error: "Cannot add blocked user as other half" },
      { status: 403 }
    );
  }

  // Check if target user has blocked the current user
  const targetUserBlocked = Array.isArray(targetUser.blocked)
    ? targetUser.blocked
    : [];
  if (targetUserBlocked.includes(String(user._id))) {
    return NextResponse.json(
      { error: "Cannot add user who has blocked you as other half" },
      { status: 403 }
    );
  }

  if (user.friends.includes(friendId)) {
    return NextResponse.json({ message: "Already friends" });
  }
  user.friends.push(friendId);
  await user.save();
  return NextResponse.json({ message: "Friend added" });
}
