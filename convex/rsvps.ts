import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const createRSVP = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get event to check if it exists and is published
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.status !== "published") {
      throw new Error("Cannot RSVP to unpublished events");
    }

    // Check if event has already passed
    if (event.startDate <= Date.now()) {
      throw new Error("Cannot RSVP to past events");
    }

    // Check for duplicate RSVP
    const existingRSVP = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", args.attendeeEmail.toLowerCase())
      )
      .first();

    if (existingRSVP) {
      throw new Error("You have already RSVPed to this event");
    }

    // Check capacity and determine status
    let status: "confirmed" | "waitlist" = "confirmed";
    
    if (event.capacity) {
      const confirmedCount = await ctx.db
        .query("rsvps")
        .withIndex("by_event_status", (q: any) => 
          q.eq("eventId", args.eventId).eq("status", "confirmed")
        )
        .collect()
        .then(rsvps => rsvps.length);

      if (confirmedCount >= event.capacity) {
        status = "waitlist";
      }
    }

    // Create RSVP
    const rsvpId = await ctx.db.insert("rsvps", {
      eventId: args.eventId,
      attendeeName: args.attendeeName.trim(),
      attendeeEmail: args.attendeeEmail.toLowerCase().trim(),
      message: args.message?.trim(),
      status,
      createdAt: Date.now(),
    });

    return {
      rsvpId,
      status,
      message: status === "waitlist" 
        ? "You've been added to the waitlist. We'll notify you if a spot opens up!"
        : "Your RSVP has been confirmed!"
    };
  },
});

export const getEventRSVPs = query({
  args: { 
    eventId: v.id("events"),
    status: v.optional(v.union(v.literal("confirmed"), v.literal("waitlist")))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("rsvps")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId));

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    const rsvps = await query
      .order("desc")
      .collect();

    return rsvps;
  },
});

export const getRSVPStats = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const allRSVPs = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q: any) => q.eq("eventId", args.eventId))
      .collect();

    const confirmed = allRSVPs.filter(r => r.status === "confirmed").length;
    const waitlist = allRSVPs.filter(r => r.status === "waitlist").length;

    const event = await ctx.db.get(args.eventId);
    const capacity = event?.capacity;
    const spotsRemaining = capacity ? Math.max(0, capacity - confirmed) : null;

    return {
      confirmed,
      waitlist,
      total: confirmed + waitlist,
      capacity,
      spotsRemaining,
      isFull: capacity ? confirmed >= capacity : false,
    };
  },
});

export const cancelRSVP = mutation({
  args: {
    eventId: v.id("events"),
    attendeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", args.attendeeEmail.toLowerCase())
      )
      .first();

    if (!rsvp) {
      throw new Error("RSVP not found");
    }

    const wasConfirmed = rsvp.status === "confirmed";
    
    // Delete the RSVP
    await ctx.db.delete(rsvp._id);

    // If this was a confirmed RSVP and there are waitlisted people, promote the first one
    if (wasConfirmed) {
      const event = await ctx.db.get(args.eventId);
      if (event?.capacity) {
        const nextWaitlisted = await ctx.db
          .query("rsvps")
          .withIndex("by_event_status", (q: any) => 
            q.eq("eventId", args.eventId).eq("status", "waitlist")
          )
          .order("asc") // First in, first promoted
          .first();

        if (nextWaitlisted) {
          await ctx.db.patch(nextWaitlisted._id, {
            status: "confirmed",
          });
          
          return {
            success: true,
            promoted: {
              name: nextWaitlisted.attendeeName,
              email: nextWaitlisted.attendeeEmail,
            }
          };
        }
      }
    }

    return { success: true };
  },
});

export const updateRSVP = mutation({
  args: {
    eventId: v.id("events"),
    attendeeEmail: v.string(),
    attendeeName: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", args.attendeeEmail.toLowerCase())
      )
      .first();

    if (!rsvp) {
      throw new Error("RSVP not found");
    }

    // Check if event is still open for updates
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.startDate <= Date.now()) {
      throw new Error("Cannot update RSVP for past events");
    }

    const updates: any = {};
    if (args.attendeeName !== undefined) {
      updates.attendeeName = args.attendeeName.trim();
    }
    if (args.message !== undefined) {
      updates.message = args.message?.trim();
    }

    await ctx.db.patch(rsvp._id, updates);
    return await ctx.db.get(rsvp._id);
  },
});

export const checkRSVPStatus = query({
  args: {
    eventId: v.id("events"),
    attendeeEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", args.attendeeEmail.toLowerCase())
      )
      .first();

    return rsvp;
  },
});