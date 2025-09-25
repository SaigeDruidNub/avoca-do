import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Message from "@/models/Message";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";

// GET: Fetch messages between two users
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const otherId = searchParams.get("user");
  if (!otherId) {
    return NextResponse.json({ error: "Missing user param" }, { status: 400 });
  }
  // Find current user by email
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = user._id.toString();
  const messages = await Message.find({
    $or: [
      { sender: userId, recipient: otherId },
      { sender: otherId, recipient: userId },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ messages });
}

// POST: Send a new message
export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { recipient, content } = await req.json();
  if (!recipient || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  // Find current user by email
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const message = await Message.create({
    sender: user._id,
    recipient,
    content,
  });
  return NextResponse.json({ message });
}
