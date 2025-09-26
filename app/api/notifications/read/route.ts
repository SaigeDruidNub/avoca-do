import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import mongoose from "mongoose";

// PATCH: Mark messages as read
export async function PATCH(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { senderId, messageIds } = body;

    // Find current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let result;

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      result = await Message.updateMany(
        {
          _id: { $in: messageIds.map((id) => new mongoose.Types.ObjectId(id)) },
          recipient: user._id,
        },
        { $set: { read: true } }
      );
    } else if (senderId) {
      // Mark all messages from a specific sender as read
      result = await Message.updateMany(
        {
          sender: new mongoose.Types.ObjectId(senderId),
          recipient: user._id,
          read: false,
        },
        { $set: { read: true } }
      );
    } else {
      // Mark all unread messages as read
      result = await Message.updateMany(
        {
          recipient: user._id,
          read: false,
        },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
