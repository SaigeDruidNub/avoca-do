import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { postId, message } = await req.json();
  if (!postId || !message) {
    return NextResponse.json(
      { error: "Missing postId or message" },
      { status: 400 }
    );
  }
  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const Post = mongoose.model("Post");
  const comment = {
    _id: new ObjectId().toString(),
    userId: session.user.email,
    userName: session.user.name || session.user.email,
    message,
    createdAt: new Date().toISOString(),
  };
  await Post.updateOne({ _id: postId }, { $push: { comments: comment } });
  return NextResponse.json({ success: true });
}
