import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const Post = mongoose.model("Post");
  // Add user email to dislikes, remove from likes
  await Post.updateOne(
    { _id: postId },
    {
      $addToSet: { dislikes: session.user.email },
      $pull: { likes: session.user.email },
    }
  );
  return NextResponse.json({ success: true });
}
