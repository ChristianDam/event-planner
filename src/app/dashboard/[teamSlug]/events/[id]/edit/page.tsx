"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useTeamBySlug, useTeamPermissions } from "@/lib/permissions";
import { useCurrentUser } from "@/lib/auth";
import { EventForm } from "@/components/events/EventForm";
import Link from "next/link";
import { Suspense } from "react";
import { Id } from "../../../../../../../convex/_generated/dataModel";

interface EditEventContentProps {
  teamSlug: string;
  eventId: string;
}

function EditEventContent({ teamSlug, eventId }: EditEventContentProps) {
  const user = useCurrentUser();
  const team = useTeamBySlug(teamSlug);
  const { permissions, isLoading: permissionsLoading } = useTeamPermissions(team?._id);
  
  const event = useQuery(
    api.events.getEvent,
    eventId ? { eventId: eventId as Id<"events"> } : "skip"
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to edit events.</p>
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

  if (team === undefined || event === undefined || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!team || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">This event doesn't exist or you don't have access.</p>
          <Link
            href={`/dashboard/${teamSlug}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if user can edit this specific event
  const canEdit = permissions.canEditAllEvents || event.createdBy === user._id;
  
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Permission Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to edit this event.</p>
          <Link
            href={`/dashboard/${teamSlug}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/dashboard/${teamSlug}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to {team.name}
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href={`/${teamSlug}/${event.slug}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Event
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <EventForm
          teamId={team._id}
          teamSlug={teamSlug}
          event={event}
          mode="edit"
        />
      </div>
    </div>
  );
}

export default async function EditEventPage({ 
  params 
}: { 
  params: Promise<{ teamSlug: string; id: string }> 
}) {
  const { teamSlug, id } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditEventContent teamSlug={teamSlug} eventId={id} />
    </Suspense>
  );
}