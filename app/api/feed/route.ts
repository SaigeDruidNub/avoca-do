import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

// GET: fetch all posts (latest first)
export async function GET(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Get current user and their friends
  const UserModel = (await import("@/models/User")).default;
  const user = await UserModel.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const friendEmails = Array.isArray(user.friends) ? user.friends : [];
  const allowedEmails = [session.user.email, ...friendEmails];

  // Feed: posts from self and other half
  const feedEmails = [session.user.email];
  if (user.otherHalf) feedEmails.push(user.otherHalf);
  const feedPosts = await Post.find({ userId: { $in: feedEmails } })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(feedPosts);
}

// POST: create a new post
export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession(authOptions);
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
      const uploadRes = await cloudinary.uploader.upload_stream(
        {
          folder: "avocado-feed",
          resource_type: "image",
        },
        (error, result) => {
          if (error) throw error;
          imageUrl = result?.secure_url || "";
        }
      );
      // Use a Promise to wait for upload_stream
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
    } catch (e) {
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 500 }
      );
    }
  }

  const post = await Post.create({
    userId: session.user.email,
    userName: session.user.name,
    userImage: session.user.image,
    message,
    imageUrl,
  });
  return NextResponse.json(post);
}
