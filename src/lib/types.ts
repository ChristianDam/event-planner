import { Id } from "../../convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  bio?: string;
  createdAt: number;
}

export interface Team {
  _id: Id<"teams">;
  name: string;
  description?: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamMember {
  _id: Id<"teamMembers">;
  teamId: Id<"teams">;
  userId: Id<"users">;
  role: "owner" | "admin" | "member";
  joinedAt: number;
}

export interface Event {
  _id: Id<"events">;
  teamId: Id<"teams">;
  createdBy: Id<"users">;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  location: {
    address: string;
    venue?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  capacity?: number;
  slug: string;
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
}

export interface RSVP {
  _id: Id<"rsvps">;
  eventId: Id<"events">;
  attendeeName: string;
  attendeeEmail: string;
  message?: string;
  status: "confirmed" | "waitlist";
  createdAt: number;
}

export interface TeamInvite {
  _id: Id<"teamInvites">;
  teamId: Id<"teams">;
  email: string;
  role: "admin" | "member";
  inviteCode: string;
  invitedBy: Id<"users">;
  expiresAt: number;
  createdAt: number;
}

export interface UserWithTeams extends User {
  teams: (Team & { role: TeamMember["role"]; joinedAt: number })[];
}