import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  validateAndSanitizeEmail,
  validateAndSanitizeName,
  validateAndSanitizeText,
} from "./lib/validation";

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

    // Validate and sanitize email for duplicate check
    const sanitizedEmailForCheck = validateAndSanitizeEmail(args.attendeeEmail);
    
    // Check for duplicate RSVP
    const existingRSVP = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", sanitizedEmailForCheck)
      )
      .first();

    if (existingRSVP) {
      throw new Error("You have already RSVPed to this event");
    }

    // Validate and sanitize inputs
    const sanitizedName = validateAndSanitizeName(args.attendeeName, "Attendee name");
    const sanitizedEmail = validateAndSanitizeEmail(args.attendeeEmail);
    const sanitizedMessage = validateAndSanitizeText(args.message, "Message", 500);

    // Use optimistic insertion to prevent race conditions
    // First, insert with confirmed status
    let status: "confirmed" | "waitlist" = "confirmed";
    
    const rsvpId = await ctx.db.insert("rsvps", {
      eventId: args.eventId,
      attendeeName: sanitizedName,
      attendeeEmail: sanitizedEmail,
      message: sanitizedMessage,
      status: "confirmed", // Initially confirmed
      createdAt: Date.now(),
    });

    // Now check if we exceeded capacity and demote to waitlist if needed
    if (event.capacity) {
      const allConfirmedRSVPs = await ctx.db
        .query("rsvps")
        .withIndex("by_event_status", (q: any) => 
          q.eq("eventId", args.eventId).eq("status", "confirmed")
        )
        .order("asc") // Order by creation time to maintain fairness
        .collect();

      if (allConfirmedRSVPs.length > event.capacity) {
        // Find RSVPs that exceed capacity (latest ones)
        const excessRSVPs = allConfirmedRSVPs.slice(event.capacity);
        
        // Check if our new RSVP is among the excess ones
        const isOurRSVPExcess = excessRSVPs.find(r => r._id === rsvpId);
        
        if (isOurRSVPExcess) {
          // Demote our RSVP to waitlist
          await ctx.db.patch(rsvpId, { status: "waitlist" });
          status = "waitlist";
        }
      }
    }


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
    // Validate and sanitize email
    const sanitizedEmail = validateAndSanitizeEmail(args.attendeeEmail);
    
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", sanitizedEmail)
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
    // Validate and sanitize email
    const sanitizedEmail = validateAndSanitizeEmail(args.attendeeEmail);
    
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", sanitizedEmail)
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
      updates.attendeeName = validateAndSanitizeName(args.attendeeName, "Attendee name");
    }
    if (args.message !== undefined) {
      updates.message = validateAndSanitizeText(args.message, "Message", 500);
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
    // Validate and sanitize email
    const sanitizedEmail = validateAndSanitizeEmail(args.attendeeEmail);
    
    const rsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_email", (q: any) => 
        q.eq("eventId", args.eventId).eq("attendeeEmail", sanitizedEmail)
      )
      .first();

    return rsvp;
  },
});