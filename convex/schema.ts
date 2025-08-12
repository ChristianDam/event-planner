import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  // Include Convex Auth tables (already includes users table)
  ...authTables,

  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    slug: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"]),

  events: defineTable({
    teamId: v.id("teams"),
    createdBy: v.id("users"),
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
    slug: v.string(),
    status: v.union(v.literal("draft"), v.literal("published")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_team_status", ["teamId", "status"])
    .index("by_slug", ["slug"])
    .index("by_team_slug", ["teamId", "slug"])
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"])
    .searchIndex("search_title", {
      searchField: "title",
    })
    .searchIndex("search_description", {
      searchField: "description",
    }),

  rsvps: defineTable({
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    message: v.optional(v.string()),
    status: v.union(v.literal("confirmed"), v.literal("waitlist")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_email", ["attendeeEmail"])
    .index("by_event_email", ["eventId", "attendeeEmail"])
    .index("by_event_status", ["eventId", "status"]),

  teamInvites: defineTable({
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    inviteCode: v.string(),
    invitedBy: v.id("users"),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_email", ["email"])
    .index("by_code", ["inviteCode"]),
});

export default schema;