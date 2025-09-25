import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  pronouns: { type: String, default: "" },
  maritalStatus: { type: String, default: "" },
  job: { type: String, default: "" },
  school: { type: String, default: "" },
  about: { type: String, default: "" },
  interests: { type: [String], default: [] },
  friends: { type: [String], default: [] }, // Array of user IDs (as strings)
  otherHalf: { type: String, default: "" }, // Email of user's real other half
  locationShared: { type: Boolean, default: false }, // Whether user has shared their location
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    city: { type: String },
    state: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.index({ location: "2dsphere" });

const User = models.User || model("User", UserSchema);

export default User;
