"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { RSVPForm } from "@/components/events/RSVPForm";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";

interface EventPageClientProps {
  teamSlug: string;
  eventSlug: string;
}

export function EventPageClient({ teamSlug, eventSlug }: EventPageClientProps) {
  const user = useCurrentUser();
  const event = useQuery(api.events.getEventBySlug, { teamSlug, eventSlug });

  if (event === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600 mb-6">
              This event doesn't exist or hasn't been published yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isPastEvent = event.startDate <= Date.now();
  const canEdit = user && ('userRole' in event) && event.userRole && (
    event.userRole === "owner" || 
    event.userRole === "admin" || 
    event.createdBy === user._id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                <Link href="/" className="hover:text-blue-600">
                  Events
                </Link>
                <span>/</span>
                <Link href={`/teams/${teamSlug}`} className="hover:text-blue-600">
                  {event.team?.name}
                </Link>
                <span>/</span>
                <span className="text-gray-900">{event.title}</span>
              </nav>

              {/* Event Status */}
              {isPastEvent && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Past Event
                  </span>
                </div>
              )}

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
              
              {/* Team Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <span className="font-medium text-blue-600">
                    {event.team?.name}
                  </span>
                  {('creator' in event) && event.creator && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Organized by {event.creator.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex items-center space-x-3 ml-6">
                <Link
                  href={`/dashboard/${teamSlug}/events/${event._id}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Event</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">When</h2>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {startDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} - {endDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Where</h2>
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  {event.location.venue && (
                    <div className="font-medium text-gray-900 mb-1">
                      {event.location.venue}
                    </div>
                  )}
                  <div className="text-gray-700">{event.location.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Section */}
            {!isPastEvent && (
              <RSVPForm eventId={event._id} eventTitle={event.title} />
            )}

            {/* Event Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
              <div className="space-y-3">
                {event.capacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium">{event.capacity} people</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Organized by</span>
                  <span className="font-medium">{event.team?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event type</span>
                  <span className="font-medium">Creative Event</span>
                </div>
              </div>
            </div>

            {/* Share */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Event</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    // Could add a toast notification here
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Copy Link
                </button>
                <div className="flex space-x-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=Check out this event: ${event.title}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}