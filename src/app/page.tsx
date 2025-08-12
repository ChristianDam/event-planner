"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";
import { useErrorHandler } from "@/hooks/useErrorHandler";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const { handleError } = useErrorHandler();

  const events = useQuery(api.discovery.getPublicEvents, {
    limit: 12,
    city: selectedCity || undefined,
    searchQuery: searchQuery || undefined,
  });

  const featuredTeams = useQuery(api.discovery.getFeaturedTeams, { limit: 6 });
  const stats = useQuery(api.discovery.getEventStats, {});

  // Handle query errors
  if (events === undefined || featuredTeams === undefined || stats === undefined) {
    // Loading state - this is normal
  } else if (events instanceof Error) {
    handleError(events, "loading events");
  } else if (featuredTeams instanceof Error) {
    handleError(featuredTeams, "loading featured teams");
  } else if (stats instanceof Error) {
    handleError(stats, "loading stats");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Creative Events in <br />
              <span className="text-yellow-300">Aarhus & Copenhagen</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover inspiring creative events, connect with passionate teams, and bring your artistic vision to life.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-2 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Search events, teams, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none rounded-md"
                  />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="px-4 py-3 border-0 focus:ring-0 focus:outline-none rounded-md bg-gray-50"
                  >
                    <option value="">All Cities</option>
                    <option value="Aarhus">Aarhus</option>
                    <option value="Copenhagen">Copenhagen</option>
                  </select>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">{stats.upcomingEvents}</div>
                  <div className="text-blue-100">Upcoming Events</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">{stats.activeTeams}</div>
                  <div className="text-blue-100">Active Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-300">{stats.totalUsers}+</div>
                  <div className="text-blue-100">Creative Members</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
          
          {events === undefined && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          )}

          {events && events.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">Try adjusting your search or check back later!</p>
            </div>
          )}

          {events && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => {
                const startDate = new Date(event.startDate);
                const endDate = new Date(event.endDate);
                
                return (
                  <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {event.location.venue || 'Creative Event'}
                        </span>
                        <div className="text-sm text-gray-500">
                          {startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link 
                          href={`/${event.team?.slug}/${event.slug}`}
                          className="hover:text-blue-600"
                        >
                          {event.title}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="space-y-2 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <Link 
                            href={`/teams/${event.team?.slug}`}
                            className="hover:text-blue-600 font-medium"
                          >
                            {event.team?.name}
                          </Link>
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.location.venue && `${event.location.venue}, `}
                          {event.location.address}
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
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
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {event.capacity && `${event.capacity} spots available`}
                        </div>
                        <Link
                          href={`/${event.team?.slug}/${event.slug}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          View Event
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Featured Teams */}
        {featuredTeams && featuredTeams.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Creative Teams</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredTeams.map((team) => (
                <div key={team._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link 
                      href={`/teams/${team.slug}`}
                      className="hover:text-blue-600"
                    >
                      {team.name}
                    </Link>
                  </h3>
                  
                  {team.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {team.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-lg font-semibold text-blue-600">{team.memberCount}</div>
                      <div className="text-gray-500">Members</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-green-600">{team.upcomingEventsCount}</div>
                      <div className="text-gray-500">Upcoming</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-purple-600">{team.recentEventsCount}</div>
                      <div className="text-gray-500">Recent</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link
                      href={`/teams/${team.slug}`}
                      className="block text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View Team
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="mt-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Create Something Amazing?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Join our community of creative professionals and start organizing your own events.
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center px-6 py-3 border border-transparent text-lg font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50"
            >
              Get Started
            </Link>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-purple-600"
            >
              Sign In
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
