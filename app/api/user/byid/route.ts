import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/user/byid?ids=ID1,ID2,ID3 or /api/user/byid?id=ID
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const idParam = searchParams.get("id");
  if (idsParam) {
    // Multiple IDs
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (ids.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    const users = await User.find({ _id: { $in: ids } })
      .select("_id name image")
      .lean();
    return NextResponse.json(users);
  } else if (idParam) {
    // Single ID
    if (!mongoose.Types.ObjectId.isValid(idParam)) {
      return NextResponse.json(
        { error: "Missing or invalid id" },
        { status: 400 }
      );
    }
    const user = await User.findById(idParam).select("_id name image").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } else {
    return NextResponse.json(
      { error: "Missing id(s) parameter" },
      { status: 400 }
    );
  }
}
