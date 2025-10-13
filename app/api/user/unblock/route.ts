import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserModel from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/user/unblock
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

    if (!Array.isArray(me.blocked)) me.blocked = [];
    if (!me.blocked.includes(userId)) {
      return NextResponse.json({ message: "User was not blocked" });
    }

    // Remove user from blocked list
    me.blocked = me.blocked.filter((id: string) => id !== userId);
    const saved = await me.save();

    return NextResponse.json({
      message: "User unblocked",
      unblockedUser: targetUser.name,
      totalBlocked: saved.blocked.length,
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
