import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import type { AuthOptions } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import type { AdapterUser } from "next-auth/adapters";
import type { Account, Profile, User as NextAuthUser } from "next-auth";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/dashboard",
  },
  callbacks: {
    async signIn(params: {
      user: AdapterUser | NextAuthUser;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, unknown>;
    }) {
      const { user } = params;
      await dbConnect();
      // Only create if not exists
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          pronouns: "",
          maritalStatus: "",
          job: "",
          school: "",
          about: "",
          interests: [],
          locationShared: false,
          location: {
            type: "Point",
            coordinates: [0, 0],
            city: "",
            state: "",
          },
        });
      }
      return true;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
