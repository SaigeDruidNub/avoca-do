import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import User from "@/models/User";
import { getServerSession } from "next-auth";

// GET /api/message/history?with=userId
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const withUserId = searchParams.get("with");

  if (!withUserId) {
    return NextResponse.json(
      { error: "Missing 'with' parameter" },
      { status: 400 }
    );
  }

  // Get current user
  const currentUser = await User.findOne({ email: session.user.email });
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Find messages between current user and the specified user
    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, recipient: withUserId },
        { sender: withUserId, recipient: currentUser._id },
      ],
    })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    // Get all user IDs to fetch names
    interface IMessage {
      _id: string;
      sender: string;
      recipient: string;
      content: string;
      createdAt: Date;
      read: boolean;
    }

    interface IUser {
      _id: string;
      name: string;
    }

    const userIds: string[] = [
      ...new Set([
        ...messages.map((m: IMessage) => m.sender.toString()),
        ...messages.map((m: IMessage) => m.recipient.toString()),
      ]),
    ];

    // Fetch user names
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name")
      .lean();

    const userNamesMap: Record<string, string> = {};
    users.forEach((user: IUser) => {
      userNamesMap[user._id.toString()] = user.name;
    });

    // Add sender names to messages
    const messagesWithNames = messages.map((msg: IMessage) => ({
      _id: msg._id.toString(),
      sender: msg.sender.toString(),
      senderName: userNamesMap[msg.sender.toString()] || "Unknown User",
      recipient: msg.recipient.toString(),
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      read: msg.read,
    }));

    return NextResponse.json(messagesWithNames);
  } catch (error) {
    console.error("Error fetching message history:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
