import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";

import { getServerSession } from "next-auth";
import cloudinary from "@/lib/cloudinary";

// GET: fetch all posts (latest first)
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Get current user and their friends
  const UserModel = (await import("@/models/User")).default;
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Support filtering by userIds (for friend feed)
  const { searchParams } = new URL(req.url);
  const userIdsParam = searchParams.get("userIds");
  if (userIdsParam) {
    // userIds is a comma-separated list of user IDs (Mongo _id as string)
    const userIds = userIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (userIds.length === 0) {
      return NextResponse.json([]);
    }
    // Find posts by userId (which is stored as stringified _id in Post.userId)
    const posts = await Post.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(posts);
  }

  // Default: posts from self and mutual friends (mutual 'other halves')
  const myId = user._id.toString();
  const friendIds = user.friends || [];
  // Find users whose _id is in my friends array AND who have me in their friends array
  const mutualFriends = await UserModel.find({
    _id: { $in: friendIds },
    friends: { $in: [myId] },
  })
    .select("_id")
    .lean();
  const mutualFriendIds = mutualFriends.map((u: { _id: string }) =>
    u._id.toString()
  );
  const feedIds = [myId, ...mutualFriendIds];
  const feedPosts = await Post.find({ userId: { $in: feedIds } })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(feedPosts);
}

// POST: create a new post
export async function POST(req: NextRequest) {
  // Debug log to diagnose GIF-only post issue
  // Place after all assignments, before validation
  // This must be after message, imageUrl, gifUrl, finalGifUrl are set
  // Move this log to after imageUrl and finalGifUrl assignment block
  // (right before validation)
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse form data (multipart)
  const formData = await req.formData();
  // Explicitly set message to empty string if missing
  let message = formData.get("message");
  if (typeof message !== "string" || message == null) message = "";
  const image = formData.get("image");
  const gifUrl = formData.get("gifUrl");

  let imageUrl = "";
  let finalGifUrl = "";
  if (gifUrl && typeof gifUrl === "string" && gifUrl.length > 0) {
    imageUrl = gifUrl;
    finalGifUrl = gifUrl;
  } else if (
    image &&
    typeof image === "object" &&
    "arrayBuffer" in image &&
    image.size > 0
  ) {
    // Upload to Cloudinary
    const buffer = Buffer.from(await image.arrayBuffer());
    try {
      await new Promise((resolve, reject) => {
        const stream: NodeJS.WritableStream = cloudinary.uploader.upload_stream(
          {
            folder: "avocado-feed",
            resource_type: "image",
          },
          (
            error: Error | null,
            result: { secure_url?: string } | undefined
          ) => {
            if (error) reject(error);
            imageUrl = result?.secure_url || "";
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    } catch {
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 500 }
      );
    }
  }

  // Find user to get _id
  const UserModel = (await import("@/models/User")).default;
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Only allow post if message or imageUrl (GIF or image) is present
  if ((!message || message.trim() === "") && !imageUrl) {
    return NextResponse.json(
      { error: "Post must have text or a GIF/image." },
      { status: 400 }
    );
  }
  // IMPORTANT: If you still get 'message is required', restart the server to reload the schema.
  const post = await Post.create({
    userId: user._id.toString(),
    userName: user.name,
    userImage: user.image,
    message,
    imageUrl,
    gifUrl: finalGifUrl,
  });
  return NextResponse.json(post);
}

// PUT: update a post (only by the creator)
export async function PUT(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId, message } = await req.json();
  if (!postId || !message) {
    return NextResponse.json(
      { error: "Missing postId or message" },
      { status: 400 }
    );
  }

  // Find user to get _id
  const UserModel = (await import("@/models/User")).default;
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find the post and verify ownership
  const post = await Post.findById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.userId !== user._id.toString()) {
    return NextResponse.json(
      { error: "You can only edit your own posts" },
      { status: 403 }
    );
  }

  // Update the post
  await Post.findByIdAndUpdate(postId, { message, updatedAt: new Date() });
  return NextResponse.json({ success: true });
}

// DELETE: delete a post (only by the creator)
export async function DELETE(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  // Find user to get _id
  const UserModel = (await import("@/models/User")).default;
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Find the post and verify ownership
  const post = await Post.findById(postId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.userId !== user._id.toString()) {
    return NextResponse.json(
      { error: "You can only delete your own posts" },
      { status: 403 }
    );
  }

  // Delete the post
  await Post.findByIdAndDelete(postId);
  return NextResponse.json({ success: true });
}
