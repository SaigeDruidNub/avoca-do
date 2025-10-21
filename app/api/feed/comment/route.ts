import dbConnect from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { postId, message, gifUrl } = await req.json();
  if (!postId || (!message && !gifUrl)) {
    return NextResponse.json(
      { error: "Missing postId or comment content" },
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
    message: message || "",
    gifUrl: gifUrl || "",
    createdAt: new Date().toISOString(),
  };
  await Post.updateOne({ _id: postId }, { $push: { comments: comment } });
  return NextResponse.json({ success: true });
}

// PUT: update a comment (only by the creator)
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, commentId, message } = await req.json();
  if (!postId || !commentId || !message) {
    return NextResponse.json(
      { error: "Missing postId, commentId, or message" },
      { status: 400 }
    );
  }

  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const Post = mongoose.model("Post");

  // Find the post and check if comment exists and belongs to user
  const post = await Post.findById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comment = post.comments.find(
    (c: {
      _id: string;
      userId: string;
      userName: string;
      message: string;
      gifUrl: string;
      createdAt: string;
    }) => c._id === commentId
  );
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== session.user.email) {
    return NextResponse.json(
      { error: "You can only edit your own comments" },
      { status: 403 }
    );
  }

  // Update the comment
  await Post.updateOne(
    { _id: postId, "comments._id": commentId },
    { $set: { "comments.$.message": message } }
  );

  return NextResponse.json({ success: true });
}

// DELETE: delete a comment (only by the creator)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const commentId = searchParams.get("commentId");

  if (!postId || !commentId) {
    return NextResponse.json(
      { error: "Missing postId or commentId" },
      { status: 400 }
    );
  }

  await dbConnect();
  const mongoose = (await import("mongoose")).default;
  const Post = mongoose.model("Post");

  // Find the post and check if comment exists and belongs to user
  const post = await Post.findById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const comment = post.comments.find(
    (c: {
      _id: string;
      userId: string;
      userName: string;
      message: string;
      gifUrl: string;
      createdAt: string;
    }) => c._id === commentId
  );
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.userId !== session.user.email) {
    return NextResponse.json(
      { error: "You can only delete your own comments" },
      { status: 403 }
    );
  }

  // Remove the comment
  await Post.updateOne(
    { _id: postId },
    { $pull: { comments: { _id: commentId } } }
  );

  return NextResponse.json({ success: true });
}
