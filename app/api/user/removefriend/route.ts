import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// POST /api/user/removefriend
// Body: { userId: string }
export async function POST(req: NextRequest) {
  try {
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

    // Verify target user exists
    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    if (!Array.isArray(me.friends)) me.friends = [];
    if (!me.friends.includes(userId)) {
      return NextResponse.json({ message: "User is not in your friends list" });
    }

    // Remove user from current user's friends list (one-sided removal)
    me.friends = me.friends.filter((friendId: string) => friendId !== userId);

    const saved = await me.save();

    return NextResponse.json({
      message: "Friend removed successfully",
      removedFriend: targetUser.name,
      totalFriends: saved.friends.length,
    });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
