import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

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
  // Add user email to likes, remove from dislikes
  await Post.updateOne(
    { _id: postId },
    {
      $addToSet: { likes: session.user.email },
      $pull: { dislikes: session.user.email },
    }
  );
  interface PostLikesDislikes {
    likes: string[];
    dislikes: string[];
  }

  const updated = (await Post.findById(postId)
    .select("likes dislikes")
    .lean()) as PostLikesDislikes | null;
  if (!updated) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({
    likes: updated.likes,
    dislikes: updated.dislikes,
  });
}
