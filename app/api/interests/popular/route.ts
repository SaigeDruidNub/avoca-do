import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    // Aggregate custom interests to find popular ones
    const popularCustomInterests = await User.aggregate([
      { $unwind: "$customInterests" },
      {
        $group: {
          _id: {
            category: "$customInterests.category",
            interest: "$customInterests.customInterest",
          },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gte: 3 } } }, // Interests used by at least 3 users
      { $sort: { count: -1 } },
      { $limit: 50 }, // Top 50 popular custom interests
    ]);

    return NextResponse.json({ popularCustomInterests });
  } catch (error) {
    console.error("Error fetching popular custom interests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// This endpoint could be used by administrators to promote custom interests
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  // Add admin check here in a real implementation
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { category, interest, promote } = await req.json();

  if (promote) {
    // Logic to promote a custom interest to the official list
    // This would typically involve:
    // 1. Adding it to a database table of official interests
    // 2. Removing it from users' custom interests
    // 3. Adding it to their regular interests

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Interest promoted to official list",
    });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
