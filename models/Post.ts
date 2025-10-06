import mongoose, { Schema, models, model } from "mongoose";

const PostSchema = new Schema(
  {
    userId: { type: String, required: true }, // MongoDB _id as string
    userName: { type: String, required: true },
    userImage: { type: String },
    message: { type: String },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    likes: { type: [String], default: [] }, // array of userIds/emails who liked
    dislikes: { type: [String], default: [] }, // array of userIds/emails who disliked
    comments: {
      type: [
        {
          _id: { type: String, required: true },
          userId: { type: String, required: true },
          userName: { type: String },
          message: { type: String },
          gifUrl: { type: String },
          createdAt: { type: String },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Post = models.Post || model("Post", PostSchema);

export default Post;
