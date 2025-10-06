import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    image: user.image,
    pronouns: user.pronouns || "",
    maritalStatus: user.maritalStatus || "",
    job: user.job || "",
    school: user.school || "",
    about: user.about || "",
    interests: user.interests || [],
  });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Parse form data
  const formData = await req.formData();
  const updates: Record<string, string> = {};
  ["name", "pronouns", "maritalStatus", "job", "school", "about"].forEach(
    (field) => {
      const value = formData.get(field);
      // Always set the field, even if blank
      updates[field] = typeof value === "string" ? value : "";
    }
  );

  // Handle image upload (store as base64 for demo, use cloudinary or s3 in prod)
  const imageFile = formData.get("image");
  if (
    imageFile &&
    typeof imageFile === "object" &&
    "arrayBuffer" in imageFile
  ) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    // Save to public/profilepics/ as email-based filename
    const fileName = `${user._id}.jpg`;
    const filePath = path.join(
      process.cwd(),
      "public",
      "profilepics",
      fileName
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    updates.image = `/profilepics/${fileName}`;
  }

  await User.updateOne({ email: session.user.email }, { $set: updates });
  return NextResponse.json({ success: true });
}
