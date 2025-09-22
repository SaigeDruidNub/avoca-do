import mongoose, { Schema, models, model } from "mongoose";

const PostSchema = new Schema(
  {
    userId: { type: String, required: true }, // MongoDB _id as string
    userName: { type: String, required: true },
    userImage: { type: String },
    message: { type: String, required: true },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Post = models.Post || model("Post", PostSchema);

export default Post;
