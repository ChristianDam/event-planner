import { v } from "convex/values";
import { query } from "./_generated/server";

export const getPublicEvents = query({
  args: {
    limit: v.optional(v.number()),
    city: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 12;
    
    // Get all upcoming published events
    let events = await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .filter((q: any) => q.gt(q.field("startDate"), Date.now()))
      .order("asc")
      .take(limit * 3); // Get more for filtering

    // Apply city filter if provided
    if (args.city) {
      const cityLower = args.city.toLowerCase();
      events = events.filter(event => 
        event.location.venue?.toLowerCase().includes(cityLower) ||
        event.location.address.toLowerCase().includes(cityLower)
      );
    }

    // Apply text search if provided
    if (args.searchQuery) {
      const searchTerm = args.searchQuery.toLowerCase();
      events = events.filter(event => 
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.location.venue?.toLowerCase().includes(searchTerm) ||
        event.location.address.toLowerCase().includes(searchTerm)
      );
    }

    // Limit results
    events = events.slice(0, limit);

    // Enrich with team information
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const team = await ctx.db.get(event.teamId);
        return {
          ...event,
          team,
        };
      })
    );

    return enrichedEvents;
  },
});

export const getFeaturedTeams = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;
    
    // Get all teams first
    const allTeams = await ctx.db.query("teams").collect();
    
    // Get team stats in parallel
    const teamsWithStats = await Promise.all(
      allTeams.map(async (team) => {
        // Get upcoming event count for this team
        const upcomingEvents = await ctx.db
          .query("events")
          .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
          .filter((q: any) => q.eq(q.field("status"), "published"))
          .filter((q: any) => q.gt(q.field("startDate"), Date.now()))
          .collect();

        // Get recent events count (last 30 days)
        const recentEvents = await ctx.db
          .query("events")
          .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
          .filter((q: any) => q.eq(q.field("status"), "published"))
          .filter((q: any) => q.gt(q.field("startDate"), Date.now() - 30 * 24 * 60 * 60 * 1000))
          .collect();

        // Get member count
        const memberCount = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
          .collect()
          .then(members => members.length);

        return {
          ...team,
          upcomingEventsCount: upcomingEvents.length,
          recentEventsCount: recentEvents.length,
          memberCount,
        };
      })
    );

    // Sort by recent activity and limit results
    return teamsWithStats
      .filter(team => team.recentEventsCount > 0 || team.upcomingEventsCount > 0)
      .sort((a, b) => (b.recentEventsCount + b.upcomingEventsCount) - (a.recentEventsCount + a.upcomingEventsCount))
      .slice(0, limit);
  },
});

export const getEventStats = query({
  args: {},
  handler: async (ctx) => {
    // Get upcoming events count
    const upcomingEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .filter((q: any) => q.gt(q.field("startDate"), Date.now()))
      .collect();

    // Get active teams (teams with events in the last 60 days)
    const recentCutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const recentEvents = await ctx.db
      .query("events")
      .withIndex("by_status", (q: any) => q.eq("status", "published"))
      .filter((q: any) => q.gt(q.field("createdAt"), recentCutoff))
      .collect();

    const activeTeamIds = new Set(recentEvents.map(event => event.teamId.toString()));

    // Get total user count (approximate active users)
    const allUsers = await ctx.db.query("users").collect();

    return {
      upcomingEvents: upcomingEvents.length,
      activeTeams: activeTeamIds.size,
      totalUsers: allUsers.length,
    };
  },
});