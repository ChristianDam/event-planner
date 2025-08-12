import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

function generateSlug(title: string): string {
  return title
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

export const getTeamEvents = query({
  args: { 
    teamId: v.id("teams"),
    status: v.optional(v.union(v.literal("draft"), v.literal("published")))
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is member of team
    const permission = await getUserPermission(ctx, args.teamId, userId);
    if (!permission) {
      throw new Error("Not a member of this team");
    }

    let query = ctx.db.query("events").withIndex("by_team", (q: any) => q.eq("teamId", args.teamId));
    
    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const events = await query
      .order("desc")
      .collect();

    // Add creator info
    const eventsWithCreators = await Promise.all(
      events.map(async (event) => {
        const creator = await ctx.db.get(event.createdBy);
        return {
          ...event,
          creator,
        };
      })
    );

    return eventsWithCreators;
  },
});

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      // For public access, only show published events
      return event.status === "published" ? event : null;
    }

    // Check if user is member of team
    const permission = await getUserPermission(ctx, event.teamId, userId);
    if (!permission) {
      // Not a team member, only show published events
      return event.status === "published" ? event : null;
    }

    // Team member can see all events
    const creator = await ctx.db.get(event.createdBy);
    const team = await ctx.db.get(event.teamId);
    
    return {
      ...event,
      creator,
      team,
      userRole: permission,
    };
  },
});

export const getEventBySlug = query({
  args: { 
    teamSlug: v.string(),
    eventSlug: v.string()
  },
  handler: async (ctx, args) => {
    // Get team first
    const team = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.teamSlug))
      .first();
    
    if (!team) {
      return null;
    }

    // Get event
    const event = await ctx.db
      .query("events")
      .withIndex("by_team_slug", (q: any) => q.eq("teamId", team._id).eq("slug", args.eventSlug))
      .first();

    if (!event) {
      return null;
    }

    const userId = await auth.getUserId(ctx);
    
    // If not authenticated or not a team member, only show published events
    if (!userId) {
      return event.status === "published" ? { ...event, team } : null;
    }

    const permission = await getUserPermission(ctx, event.teamId, userId);
    if (!permission && event.status !== "published") {
      return null;
    }

    const creator = await ctx.db.get(event.createdBy);
    
    return {
      ...event,
      team,
      creator,
      userRole: permission,
    };
  },
});

export const create = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.object({
      address: v.string(),
      venue: v.optional(v.string()),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
    }),
    capacity: v.optional(v.number()),
    status: v.union(v.literal("draft"), v.literal("published")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions - all team members can create events
    const permission = await getUserPermission(ctx, args.teamId, userId);
    if (!permission) {
      throw new Error("Not a member of this team");
    }

    // Validate dates
    if (args.endDate <= args.startDate) {
      throw new Error("End date must be after start date");
    }

    if (args.startDate <= Date.now()) {
      throw new Error("Event cannot start in the past");
    }

    // Generate unique slug
    const baseSlug = generateSlug(args.title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await ctx.db
      .query("events")
      .withIndex("by_team_slug", (q: any) => q.eq("teamId", args.teamId).eq("slug", slug))
      .first()) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const now = Date.now();

    const eventId = await ctx.db.insert("events", {
      teamId: args.teamId,
      createdBy: userId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      location: args.location,
      capacity: args.capacity,
      slug,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return { eventId, slug };
  },
});

export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.object({
      address: v.string(),
      venue: v.optional(v.string()),
      coordinates: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
    })),
    capacity: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check permissions
    const permission = await getUserPermission(ctx, event.teamId, userId);
    if (!permission) {
      throw new Error("Not a member of this team");
    }

    // Members can only edit their own events, admins/owners can edit any
    const canEdit = permission === "owner" || permission === "admin" || event.createdBy === userId;
    if (!canEdit) {
      throw new Error("You can only edit events you created");
    }

    const updates: any = { updatedAt: Date.now() };

    // Validate and update dates if provided
    const startDate = args.startDate ?? event.startDate;
    const endDate = args.endDate ?? event.endDate;
    
    if (endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    if (args.title !== undefined) {
      updates.title = args.title;
      
      // Update slug if title changed
      if (args.title !== event.title) {
        const baseSlug = generateSlug(args.title);
        let slug = baseSlug;
        let counter = 1;
        
        while (true) {
          const existingEvent = await ctx.db
            .query("events")
            .withIndex("by_team_slug", (q: any) => q.eq("teamId", event.teamId).eq("slug", slug))
            .first();
          
          if (!existingEvent || existingEvent._id === args.eventId) {
            break;
          }
          
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        updates.slug = slug;
      }
    }

    if (args.description !== undefined) updates.description = args.description;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.location !== undefined) updates.location = args.location;
    if (args.capacity !== undefined) updates.capacity = args.capacity;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.eventId, updates);
    return await ctx.db.get(args.eventId);
  },
});

export const deleteEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check permissions
    const permission = await getUserPermission(ctx, event.teamId, userId);
    if (!permission) {
      throw new Error("Not a member of this team");
    }

    // Members can only delete their own events, admins/owners can delete any
    const canDelete = permission === "owner" || permission === "admin" || event.createdBy === userId;
    if (!canDelete) {
      throw new Error("You can only delete events you created");
    }

    // Delete associated RSVPs
    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    await Promise.all(rsvps.map(rsvp => ctx.db.delete(rsvp._id)));

    // Delete event
    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

export const getPublishedEvents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    const events = await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .order("desc")
      .take(limit);

    // Add team and creator info
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        const team = await ctx.db.get(event.teamId);
        const creator = await ctx.db.get(event.createdBy);
        return {
          ...event,
          team,
          creator,
        };
      })
    );

    return {
      events: eventsWithDetails,
      isDone: events.length < limit,
    };
  },
});

export const searchEvents = query({
  args: {
    searchTerm: v.string(),
    teamId: v.optional(v.id("teams")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    // Search by title
    const titleResults = await ctx.db
      .query("events")
      .withSearchIndex("search_title", (q: any) => q.search("title", args.searchTerm))
      .filter((q: any) => {
        let filter = q.eq(q.field("status"), "published");
        if (args.teamId) {
          filter = q.and(filter, q.eq(q.field("teamId"), args.teamId));
        }
        return filter;
      })
      .take(limit);

    // Add team info
    const eventsWithTeams = await Promise.all(
      titleResults.map(async (event) => {
        const team = await ctx.db.get(event.teamId);
        return {
          ...event,
          team,
        };
      })
    );

    return eventsWithTeams;
  },
});