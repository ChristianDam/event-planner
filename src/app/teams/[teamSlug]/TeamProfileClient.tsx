"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";

interface TeamProfileClientProps {
  teamSlug: string;
}

export function TeamProfileClient({ teamSlug }: TeamProfileClientProps) {
  const user = useCurrentUser();
  const teamProfile = useQuery(api.teams.getTeamProfile, { slug: teamSlug });

  if (teamProfile === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team profile...</p>
        </div>
      </div>
    );
  }

  if (!teamProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Team Not Found</h2>
            <p className="text-gray-600 mb-6">
              This team doesn't exist or is not publicly visible.
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

  const upcomingEvents = teamProfile.events.filter(event => event.startDate > Date.now());
  const pastEvents = teamProfile.events.filter(event => event.startDate <= Date.now());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{teamProfile.name}</h1>
            {teamProfile.description && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
                {teamProfile.description}
              </p>
            )}
            
            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{teamProfile.memberCount}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{teamProfile.stats.upcomingEvents}</div>
                <div className="text-sm text-gray-600">Upcoming Events</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{teamProfile.stats.totalEvents}</div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Section */}
          <div className="lg:col-span-2">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upcoming Events</h2>
                <div className="space-y-6">
                  {upcomingEvents.map((event) => {
                    const startDate = new Date(event.startDate);
                    return (
                      <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              <Link 
                                href={`/${teamSlug}/${event.slug}`}
                                className="hover:text-blue-600"
                              >
                                {event.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {event.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {startDate.toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {event.location.address}
                              </div>
                              {event.capacity && (
                                <div className="flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  {event.capacity} spots
                                </div>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/${teamSlug}/${event.slug}`}
                            className="ml-4 inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Event
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Events</h2>
                <div className="space-y-4">
                  {pastEvents.map((event) => {
                    const startDate = new Date(event.startDate);
                    return (
                      <div key={event._id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                              <Link 
                                href={`/${teamSlug}/${event.slug}`}
                                className="hover:text-blue-600"
                              >
                                {event.title}
                              </Link>
                            </h3>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {startDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Past Event
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Events */}
            {teamProfile.events.length === 0 && (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
                <p className="text-gray-600">This team hasn't published any events yet. Check back later!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
              <div className="space-y-3">
                {teamProfile.publicMembers.map((member, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{member.role}</div>
                    </div>
                  </div>
                ))}
                {teamProfile.memberCount > teamProfile.publicMembers.length && (
                  <div className="text-sm text-gray-500 pt-2 border-t border-gray-200">
                    +{teamProfile.memberCount - teamProfile.publicMembers.length} more member{teamProfile.memberCount - teamProfile.publicMembers.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>

            {/* Join Team CTA */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Interested in joining?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Connect with this creative team and collaborate on exciting projects.
              </p>
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-gray-50"
              >
                Get Started
              </Link>
            </div>

            {/* Quick Links */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  Browse All Events
                </Link>
                <Link
                  href="/auth/sign-in"
                  className="block text-sm text-blue-600 hover:text-blue-800"
                >
                  Create Your Own Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}