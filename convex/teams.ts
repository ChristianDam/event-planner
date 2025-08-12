import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function getUserPermission(ctx: any, teamId: any, userId: any) {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q: any) => q.eq("teamId", teamId).eq("userId", userId))
    .first();
  
  return membership?.role || null;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db.get(membership.teamId);
        return {
          ...team,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return teams.filter(team => team !== null);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();
  },
});

export const getWithPermission = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }

    const permission = await getUserPermission(ctx, args.teamId, userId);
    
    return {
      ...team,
      userRole: permission,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.name);
    let slug = baseSlug;
    let counter = 1;
    
    while (await ctx.db.query("teams").withIndex("by_slug", (q: any) => q.eq("slug", slug)).first()) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();
    
    // Create team
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
      slug,
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as owner
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    return { teamId, slug };
  },
});

export const update = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const permission = await getUserPermission(ctx, args.teamId, userId);
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Insufficient permissions to update team");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const updates: any = { updatedAt: Date.now() };
    
    if (args.name !== undefined) {
      updates.name = args.name;
      
      // Update slug if name changed
      if (args.name !== team.name) {
        const baseSlug = generateSlug(args.name);
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const existingTeam = await ctx.db
            .query("teams")
            .withIndex("by_slug", (q: any) => q.eq("slug", slug))
            .first();
          
          if (!existingTeam || existingTeam._id === args.teamId) {
            break;
          }
          
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        updates.slug = slug;
      }
    }
    
    if (args.description !== undefined) {
      updates.description = args.description;
    }

    await ctx.db.patch(args.teamId, updates);
    return await ctx.db.get(args.teamId);
  },
});

export const getMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is member of team
    const userPermission = await getUserPermission(ctx, args.teamId, userId);
    if (!userPermission) {
      throw new Error("Not a member of this team");
    }

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q: any) => q.eq("teamId", args.teamId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          userId: membership.userId,
          user,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    return members.filter(member => member.user !== null);
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check permissions - only owners and admins can add members
    const permission = await getUserPermission(ctx, args.teamId, currentUserId);
    if (!permission || (permission !== "owner" && permission !== "admin")) {
      throw new Error("Insufficient permissions to add members");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q: any) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this team");
    }

    // Add member
    await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateMemberRole = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
    newRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Only owners can change roles
    const permission = await getUserPermission(ctx, args.teamId, currentUserId);
    if (permission !== "owner") {
      throw new Error("Only team owners can change member roles");
    }

    // Can't change own role
    if (currentUserId === args.userId) {
      throw new Error("Cannot change your own role");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q: any) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });

    return { success: true };
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentPermission = await getUserPermission(ctx, args.teamId, currentUserId);
    const targetPermission = await getUserPermission(ctx, args.teamId, args.userId);

    // Can remove yourself (leave team)
    if (currentUserId === args.userId) {
      // Owners cannot leave if they're the only owner
      if (currentPermission === "owner") {
        const owners = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q: any) => q.eq("teamId", args.teamId))
          .filter((q: any) => q.eq(q.field("role"), "owner"))
          .collect();

        if (owners.length <= 1) {
          throw new Error("Cannot leave team as the only owner. Transfer ownership first.");
        }
      }
    } else {
      // Removing someone else - need appropriate permissions
      if (!currentPermission || (currentPermission !== "owner" && currentPermission !== "admin")) {
        throw new Error("Insufficient permissions to remove members");
      }

      // Admins cannot remove other admins or owners
      if (currentPermission === "admin" && (targetPermission === "admin" || targetPermission === "owner")) {
        throw new Error("Admins cannot remove other admins or owners");
      }
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q: any) => q.eq("teamId", args.teamId).eq("userId", args.userId))
      .first();

    if (!membership) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});

export const getTeamProfile = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (!team) {
      return null;
    }

    // Get published events for this team
    const events = await ctx.db
      .query("events")
      .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
      .filter((q: any) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(6);

    // Get team members count and some member info
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
      .collect();

    const memberCount = memberships.length;

    // Get some public member info (just names for display)
    const publicMembers = await Promise.all(
      memberships.slice(0, 5).map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        return {
          name: user?.name,
          role: membership.role,
          joinedAt: membership.joinedAt,
        };
      })
    );

    // Get event stats
    const upcomingEvents = events.filter(event => event.startDate > Date.now());
    const pastEvents = await ctx.db
      .query("events")
      .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
      .filter((q: any) => q.eq(q.field("status"), "published"))
      .filter((q: any) => q.lt(q.field("startDate"), Date.now()))
      .collect();

    return {
      ...team,
      events,
      memberCount,
      publicMembers: publicMembers.filter(member => member.name),
      stats: {
        upcomingEvents: upcomingEvents.length,
        pastEvents: pastEvents.length,
        totalEvents: events.length + pastEvents.length,
      },
    };
  },
});