import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET: Get privacy preferences for the current user
export async function GET(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      privacy: user.privacy || {
        onlyDiscoverableByEmail: false,
      },
    });
  } catch (error) {
    console.error("Error fetching privacy preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch privacy preferences" },
      { status: 500 }
    );
  }
}

// PATCH: Update privacy preferences
export async function PATCH(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { privacy } = body;

    if (!privacy || typeof privacy !== "object") {
      return NextResponse.json(
        { error: "Invalid privacy preferences" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "privacy.onlyDiscoverableByEmail":
            privacy.onlyDiscoverableByEmail ?? false,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Privacy preferences updated",
      privacy: user.privacy,
    });
  } catch (error) {
    console.error("Error updating privacy preferences:", error);
    return NextResponse.json(
      { error: "Failed to update privacy preferences" },
      { status: 500 }
    );
  }
}
