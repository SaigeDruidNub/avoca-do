import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/user/blocked - Get list of blocked users
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await UserModel.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the blocked user IDs
    const blockedIds = Array.isArray(currentUser.blocked)
      ? currentUser.blocked
      : [];

    if (blockedIds.length === 0) {
      return NextResponse.json({ blockedUsers: [] });
    }

    // Fetch the blocked users' details (excluding email for privacy)
    const blockedUsers = await UserModel.find(
      { _id: { $in: blockedIds } },
      { name: 1, image: 1, _id: 1 }
    );

    // Format the response
    const formattedBlockedUsers = blockedUsers.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      image: user.image,
    }));

    return NextResponse.json({
      blockedUsers: formattedBlockedUsers,
      totalBlocked: formattedBlockedUsers.length,
    });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
