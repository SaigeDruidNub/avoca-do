import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { interests, customInterests } = await req.json();

  if (!Array.isArray(interests)) {
    return NextResponse.json({ error: "Invalid interests" }, { status: 400 });
  }

  await dbConnect();

  const updateData: any = {
    interests,
    customInterests: customInterests || [],
  };

  if (
    customInterests &&
    Array.isArray(customInterests) &&
    customInterests.length > 0
  ) {
    // Validate each custom interest
    const validCustomInterests = customInterests.filter(
      (custom) =>
        custom &&
        typeof custom === "object" &&
        custom.category &&
        custom.customInterest &&
        custom.category.trim() !== "" &&
        custom.customInterest.trim() !== ""
    );

    updateData.customInterests = validCustomInterests;

    // Track popular custom interests (for future promotion to official list)
    for (const custom of validCustomInterests) {
    }
  } else {
    updateData.customInterests = [];
  }

  try {
    // Use findOneAndUpdate with relaxed validation
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          interests: updateData.interests,
          customInterests: updateData.customInterests,
          updatedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: false,
        strict: false,
      }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database update error:", error);
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findOne({ email: session.user.email });

  return NextResponse.json({
    interests: user?.interests || [],
    customInterests: user?.customInterests || [],
  });
}
