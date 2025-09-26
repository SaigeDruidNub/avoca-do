import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import { getServerSession } from "next-auth";

// GET /api/user/all
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find current user to exclude them from results
  const me = await User.findOne({ email: session.user.email });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get friends from user's friends array
  const friendIds = me.friends || [];

  // Find users who have sent or received messages from the current user
  const messages = await Message.find({
    $or: [{ sender: me._id }, { recipient: me._id }],
  })
    .select("sender recipient")
    .lean();

  // Extract unique user IDs from messages (excluding current user)
  const messageUserIds = new Set<string>();
  messages.forEach((msg: any) => {
    const senderId = msg.sender.toString();
    const recipientId = msg.recipient.toString();

    if (senderId !== me._id.toString()) {
      messageUserIds.add(senderId);
    }
    if (recipientId !== me._id.toString()) {
      messageUserIds.add(recipientId);
    }
  });

  // Combine friends and users with message history
  const relevantUserIds = new Set([
    ...friendIds,
    ...Array.from(messageUserIds),
  ]);

  // Find users who are either friends or have message history
  const users = await User.find({
    _id: { $in: Array.from(relevantUserIds) },
  })
    .select("_id name image email")
    .lean();

  // Format users for the frontend
  const allUsers = users.map((user: any) => ({
    _id: user._id.toString(),
    name: user.name as string,
    image: user.image as string | undefined,
    email: user.email as string,
  }));

  return NextResponse.json(allUsers);
}
