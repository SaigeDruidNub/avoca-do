import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/user/block
// Body: { userId: string }
export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const me = await UserModel.findOne({ email: session.user.email });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!Array.isArray(me.blocked)) me.blocked = [];
  if (me.blocked.includes(userId)) {
    return NextResponse.json({ message: "Already blocked" });
  }
  me.blocked.push(userId);
  await me.save();
  return NextResponse.json({ message: "User blocked" });
}
