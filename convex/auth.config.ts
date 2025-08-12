import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.profile.email as string))
        .first();

      if (existingUser) {
        // Update existing user if needed
        await ctx.db.patch(existingUser._id, {
          name: args.profile.name as string,
        });
        return existingUser._id;
      } else {
        // Create new user
        const userId = await ctx.db.insert("users", {
          name: args.profile.name as string,
          email: args.profile.email as string,
          createdAt: Date.now(),
        });
        return userId;
      }
    },
  },
});