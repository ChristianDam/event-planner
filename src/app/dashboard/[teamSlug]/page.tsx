"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useTeamBySlug, useTeamPermissions } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Suspense, useState } from "react";
import { InviteSystem } from "@/components/teams/InviteSystem";

interface TeamDashboardContentProps {
  teamSlug: string;
}

function TeamDashboardContent({ teamSlug }: TeamDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<"events" | "members" | "invites">("events");
  
  const user = useCurrentUser();
  const team = useTeamBySlug(teamSlug);
  const { permissions, role, isLoading, hasAccess } = useTeamPermissions(team?._id);
  
  const events = useQuery(
    api.events.getTeamEvents,
    team?._id ? { teamId: team._id } : "skip"
  );

  const teamMembers = useQuery(
    api.teams.getMembers,
    team?._id ? { teamId: team._id } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access team dashboard.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (team === undefined || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-4">This team doesn't exist or you don't have access.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You are not a member of this team.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const upcomingEvents = events?.filter(e => e.startDate > Date.now()) || [];
  const pastEvents = events?.filter(e => e.startDate <= Date.now()) || [];
  const draftEvents = events?.filter(e => e.status === "draft") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-sm text-gray-600">
                {role && (
                  <span className="capitalize mr-2">{role}</span>
                )}
                {teamMembers && `${teamMembers.length} members`}
              </p>
            </div>
            
            <div className="flex gap-3">
              {permissions.canCreateEvents && (
                <Link
                  href={`/dashboard/${teamSlug}/events/new`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Event
                </Link>
              )}
              
              {permissions.canEditTeamSettings && (
                <Link
                  href={`/dashboard/${teamSlug}/settings`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Settings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("events")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "events"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Events ({events?.length || 0})
            </button>
            
            <button
              onClick={() => setActiveTab("members")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Members ({teamMembers?.length || 0})
            </button>

            {permissions.canInviteMembers && (
              <button
                onClick={() => setActiveTab("invites")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "invites"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Invitations
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "events" && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming Events
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {upcomingEvents.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Draft Events
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {draftEvents.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="w-0 flex-1">
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Past Events
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {pastEvents.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Events List */}
            {events?.length === 0 ? (
              <div className="text-center bg-white shadow rounded-lg p-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first team event.
                </p>
                {permissions.canCreateEvents && (
                  <Link
                    href={`/dashboard/${teamSlug}/events/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Your First Event
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {events?.map((event) => (
                    <li key={event._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-600 truncate">
                              <Link href={`/${teamSlug}/${event.slug}`}>
                                {event.title}
                              </Link>
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(event.startDate).toLocaleDateString()} • {event.location.venue || event.location.address}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.status === "published" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-yellow-100 text-yellow-800"
                              }`}>
                                {event.status}
                              </span>
                              {event.creator && (
                                <span className="text-xs text-gray-500">
                                  by {event.creator.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {(permissions.canEditAllEvents || event.createdBy === user._id) && (
                              <Link
                                href={`/dashboard/${teamSlug}/events/${event._id}/edit`}
                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {teamMembers?.map((member) => (
                <li key={member.userId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === "owner"
                        ? "bg-purple-100 text-purple-800"
                        : member.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "invites" && permissions.canInviteMembers && (
          <InviteSystem teamId={team._id} />
        )}
      </div>
    </div>
  );
}

export default async function TeamDashboard({ params }: { params: Promise<{ teamSlug: string }> }) {
  const { teamSlug } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TeamDashboardContent teamSlug={teamSlug} />
    </Suspense>
  );
}