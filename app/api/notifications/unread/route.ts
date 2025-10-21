import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";

// GET: Get unread message count for the current user
export async function GET(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count unread messages for this user
    const unreadCount = await Message.countDocuments({
      recipient: user._id,
      read: false,
    });

    // Get unread messages grouped by sender for detailed counts
    const unreadBySender = await Message.aggregate([
      {
        $match: {
          recipient: user._id,
          read: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
          latestMessage: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "senderInfo",
        },
      },
      {
        $unwind: "$senderInfo",
      },
      {
        $project: {
          senderId: "$_id",
          senderName: "$senderInfo.name",
          senderImage: "$senderInfo.image",
          count: 1,
          latestMessage: 1,
        },
      },
      {
        $sort: { latestMessage: -1 },
      },
    ]);

    return NextResponse.json({
      totalUnread: unreadCount,
      unreadBySender,
    });
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread messages" },
      { status: 500 }
    );
  }
}
