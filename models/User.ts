import mongoose, { Schema, models, model } from "mongoose";

// Clear the existing model if it exists (for development)
if (models.User) {
  delete models.User;
}

const UserSchema = new Schema({
  blocked: { type: [String], default: [] }, // Array of blocked user IDs
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  pronouns: { type: String, default: "" },
  maritalStatus: { type: String, default: "" },
  job: { type: String, default: "" },
  school: { type: String, default: "" },
  about: { type: String, default: "" },
  interests: { type: [String], default: [] },
  customInterests: {
    type: [
      {
        category: { type: String, required: false },
        customInterest: { type: String, required: false },
      },
    ],
    default: [],
  },
  friends: { type: [String], default: [] }, // Array of user IDs (as strings)
  otherHalf: { type: String, default: "" }, // Email of user's real other half
  locationShared: { type: Boolean, default: false }, // Whether user has shared their location
  // Notification settings
  notifications: {
    sound: { type: Boolean, default: true },
    desktop: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
  },
  // Privacy settings
  privacy: {
    onlyDiscoverableByEmail: { type: Boolean, default: false },
  },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    city: { type: String },
    state: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.index({ location: "2dsphere" });

const User = models.User || model("User", UserSchema);

export default User;
