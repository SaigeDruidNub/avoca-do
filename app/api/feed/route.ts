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

  // Default: posts from self and friends (by _id)
  const feedIds = [user._id.toString(), ...(user.friends || [])];
  const feedPosts = await Post.find({ userId: { $in: feedIds } })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(feedPosts);
}

// POST: create a new post
export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse form data (multipart)
  const formData = await req.formData();
  const message = formData.get("message");
  const image = formData.get("image");

  let imageUrl = "";
  if (
    image &&
    typeof image === "object" &&
    "arrayBuffer" in image &&
    image.size > 0
  ) {
    // Upload to Cloudinary
    const buffer = Buffer.from(await image.arrayBuffer());
    try {
      await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avocado-feed", resource_type: "image" },
          (error, result) => {
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
  const post = await Post.create({
    userId: user._id.toString(),
    userName: user.name,
    userImage: user.image,
    message,
    imageUrl,
  });
  return NextResponse.json(post);
}
