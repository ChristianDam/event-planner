import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { validateAndSanitizeEmail } from "./lib/validation";

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getUserPermission(ctx: any, teamId: any, userId: any) {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q: any) => q.eq("teamId", teamId).eq("userId", userId))
    .first();
  
  return membership?.role || null;
}

export const createInvite = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions - only owners and admins can send invites
    const permission = await getUserPermission(ctx, args.teamId, userId);
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Insufficient permissions to send invites");
    }

    // Validate and sanitize email
    const sanitizedEmail = validateAndSanitizeEmail(args.email);

    // Check if team exists
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Check if user is already a member - we'll skip this check for now
    // since we can't easily query users by email with authTables
    // The invitation acceptance will handle duplicate membership checks

    // Check if there's already a pending invite for this email
    const existingInvite = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q: any) => q.eq("teamId", args.teamId))
      .filter((q: any) => q.eq(q.field("email"), sanitizedEmail))
      .first();

    if (existingInvite && existingInvite.expiresAt > Date.now()) {
      throw new Error("An invite for this email is already pending");
    }

    // Clean up expired invite if exists
    if (existingInvite) {
      await ctx.db.delete(existingInvite._id);
    }

    // Generate unique invite code with collision handling
    let inviteCode = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      const existingCode = await ctx.db.query("teamInvites").withIndex("by_code", (q: any) => q.eq("inviteCode", inviteCode)).first();
      if (!existingCode) {
        break;
      }
      inviteCode = generateInviteCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error("Unable to generate unique invite code. Please try again.");
    }

    // Create invite (expires in 7 days)
    const inviteId = await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      email: sanitizedEmail,
      role: args.role,
      inviteCode,
      invitedBy: userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
    });

    return {
      inviteId,
      inviteCode,
      inviteUrl: `/join/${inviteCode}`,
    };
  },
});

export const getInviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_code", (q: any) => q.eq("inviteCode", args.code))
      .first();

    if (!invite || invite.expiresAt < Date.now()) {
      return null;
    }

    const team = await ctx.db.get(invite.teamId);
    const inviter = await ctx.db.get(invite.invitedBy);

    return {
      ...invite,
      team,
      inviter,
    };
  },
});

// Note: User signup and invite acceptance is handled through the auth system
// and the acceptInviteExistingUser mutation below

export const acceptInviteExistingUser = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get invite first
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_code", (q: any) => q.eq("inviteCode", args.code))
      .first();

    if (!invite || invite.expiresAt < Date.now()) {
      throw new Error("Invite code is invalid or expired");
    }

    // Note: We can't easily verify email with authTables structure
    // This is a limitation we'll need to work around

    // Check if already a member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q: any) => q.eq("teamId", invite.teamId).eq("userId", userId))
      .first();
    
    if (membership) {
      await ctx.db.delete(invite._id);
      throw new Error("You are already a member of this team");
    }

    // Add user to team
    await ctx.db.insert("teamMembers", {
      teamId: invite.teamId,
      userId,
      role: invite.role,
      joinedAt: Date.now(),
    });

    // Clean up invite
    await ctx.db.delete(invite._id);

    const team = await ctx.db.get(invite.teamId);
    return { 
      success: true, 
      teamSlug: team?.slug,
      role: invite.role 
    };
  },
});

export const getTeamInvites = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    const permission = await getUserPermission(ctx, args.teamId, userId);
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Insufficient permissions to view invites");
    }

    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q: any) => q.eq("teamId", args.teamId))
      .collect();

    // Filter out expired invites and add inviter info
    const validInvites = await Promise.all(
      invites
        .filter(invite => invite.expiresAt > Date.now())
        .map(async (invite) => {
          const inviter = await ctx.db.get(invite.invitedBy);
          return {
            ...invite,
            inviter,
          };
        })
    );

    return validInvites;
  },
});

export const cancelInvite = mutation({
  args: { inviteId: v.id("teamInvites") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    // Check permissions
    const permission = await getUserPermission(ctx, invite.teamId, userId);
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Insufficient permissions to cancel invites");
    }

    await ctx.db.delete(args.inviteId);
    return { success: true };
  },
});