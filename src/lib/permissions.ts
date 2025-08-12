import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export type TeamRole = "owner" | "admin" | "member";

export interface TeamPermissions {
  canCreateEvents: boolean;
  canEditAllEvents: boolean;
  canDeleteEvents: boolean;
  canManageMembers: boolean;
  canEditTeamSettings: boolean;
  canInviteMembers: boolean;
}

export function getTeamPermissions(role: TeamRole | null): TeamPermissions {
  if (!role) {
    return {
      canCreateEvents: false,
      canEditAllEvents: false,
      canDeleteEvents: false,
      canManageMembers: false,
      canEditTeamSettings: false,
      canInviteMembers: false,
    };
  }

  switch (role) {
    case "owner":
      return {
        canCreateEvents: true,
        canEditAllEvents: true,
        canDeleteEvents: true,
        canManageMembers: true,
        canEditTeamSettings: true,
        canInviteMembers: true,
      };
    
    case "admin":
      return {
        canCreateEvents: true,
        canEditAllEvents: true,
        canDeleteEvents: true,
        canManageMembers: true,
        canEditTeamSettings: false,
        canInviteMembers: true,
      };
    
    case "member":
      return {
        canCreateEvents: true,
        canEditAllEvents: false,
        canDeleteEvents: false,
        canManageMembers: false,
        canEditTeamSettings: false,
        canInviteMembers: false,
      };
  }
}

export function useTeamPermissions(teamId: Id<"teams"> | undefined) {
  const teamData = useQuery(
    api.teams.getWithPermission,
    teamId ? { teamId } : "skip"
  );

  const role = teamData?.userRole || null;
  const permissions = getTeamPermissions(role);

  return {
    role,
    permissions,
    isLoading: teamData === undefined,
    isOwner: role === "owner",
    isAdmin: role === "admin",
    isMember: role === "member",
    hasAccess: role !== null,
  };
}

export function useUserTeams() {
  return useQuery(api.teams.list);
}

export function useTeamBySlug(slug: string | undefined) {
  return useQuery(
    api.teams.getBySlug,
    slug ? { slug } : "skip"
  );
}

export function useTeamMembers(teamId: Id<"teams"> | undefined) {
  return useQuery(
    api.teams.getMembers,
    teamId ? { teamId } : "skip"
  );
}

export function canUserPerformAction(
  userRole: TeamRole | null,
  action: keyof TeamPermissions
): boolean {
  const permissions = getTeamPermissions(userRole);
  return permissions[action];
}

export function canEditEvent(
  userRole: TeamRole | null,
  isEventCreator: boolean
): boolean {
  if (!userRole) return false;
  
  // Owners and admins can edit any event
  if (userRole === "owner" || userRole === "admin") {
    return true;
  }
  
  // Members can only edit their own events
  return userRole === "member" && isEventCreator;
}

export function canDeleteEvent(
  userRole: TeamRole | null,
  isEventCreator: boolean
): boolean {
  if (!userRole) return false;
  
  // Owners and admins can delete any event
  if (userRole === "owner" || userRole === "admin") {
    return true;
  }
  
  // Members can only delete their own events
  return userRole === "member" && isEventCreator;
}