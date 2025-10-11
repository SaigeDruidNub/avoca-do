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

  // Get blocked users to exclude them
  const blockedByMe = me.blocked || [];

  // Find users who have blocked the current user
  const usersWhoBlockedMe = await User.find({
    blocked: me._id.toString(),
  })
    .select("_id")
    .lean();
  const blockedMeIds = usersWhoBlockedMe.map((u: any) => u._id.toString());

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

  // Create exclusion list (users blocked by me + users who blocked me)
  const excludeUserIds = [...blockedByMe, ...blockedMeIds];

  // Filter out blocked users from relevant user IDs
  const filteredUserIds = Array.from(relevantUserIds).filter(
    (id) => !excludeUserIds.includes(id)
  );

  // Find users who are either friends or have message history (excluding blocked users)
  const users = await User.find({
    _id: { $in: filteredUserIds },
  })
    .select("_id name image")
    .lean();

  // Format users for the frontend (excluding email for privacy)
  const allUsers = users.map((user: any) => ({
    _id: user._id.toString(),
    name: user.name as string,
    image: user.image as string | undefined,
  }));

  return NextResponse.json(allUsers);
}
