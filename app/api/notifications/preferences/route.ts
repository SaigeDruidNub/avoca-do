import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// GET: Get notification preferences for the current user
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
      notifications: user.notifications || {
        sound: true,
        desktop: true,
        email: false,
      },
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

// PATCH: Update notification preferences
export async function PATCH(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notifications } = body;

    if (!notifications || typeof notifications !== "object") {
      return NextResponse.json(
        { error: "Invalid notification preferences" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          "notifications.sound": notifications.sound ?? true,
          "notifications.desktop": notifications.desktop ?? true,
          "notifications.email": notifications.email ?? false,
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Notification preferences updated",
      notifications: user.notifications,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
