import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
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

  // Find all users except current user
  const users = await User.find({ _id: { $ne: me._id } })
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
