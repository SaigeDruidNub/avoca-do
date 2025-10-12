import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";

// GET /api/user/search?q=searchTerm
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get search query from URL parameters
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Find current user to exclude them from results
  const me = await User.findOne({ email: session.user.email });
  if (!me) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get blocked users to exclude them
  const blockedByMe = me.blocked || [];

  // Find users who have blocked the current user
  const usersWhoBlockedMe = await User.find({
    blocked: me._id.toString(),
  })
    .select("_id")
    .lean();
  const blockedMeIds = usersWhoBlockedMe.map((u: any) => u._id.toString());

  // Create exclusion list (current user + users blocked by me + users who blocked me)
  const excludeUserIds = [me._id.toString(), ...blockedByMe, ...blockedMeIds];

  try {
    // Search by name or email using case-insensitive regex
    const searchRegex = new RegExp(query.trim(), "i");

    const users = await User.find({
      $and: [
        {
          _id: { $nin: excludeUserIds },
        },
        {
          $or: [
            { name: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
          ],
        },
      ],
    })
      .select("_id name image")
      .limit(20) // Limit results to prevent overwhelming the UI
      .lean();

    // Format users for the frontend (exclude email for privacy)
    const searchResults = users.map((user: any) => ({
      _id: user._id.toString(),
      name: user.name as string,
      image: user.image as string | undefined,
    }));

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
