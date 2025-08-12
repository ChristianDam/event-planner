"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface RSVPFormProps {
  eventId: Id<"events">;
  eventTitle: string;
}

export function RSVPForm({ eventId, eventTitle }: RSVPFormProps) {
  const [formData, setFormData] = useState({
    attendeeName: "",
    attendeeEmail: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(true);

  const rsvpStats = useQuery(api.rsvps.getRSVPStats, { eventId });
  const createRSVP = useMutation(api.rsvps.createRSVP);
  const cancelRSVP = useMutation(api.rsvps.cancelRSVP);

  // Check if user has already RSVPed
  const existingRSVP = useQuery(
    api.rsvps.checkRSVPStatus,
    formData.attendeeEmail
      ? { eventId, attendeeEmail: formData.attendeeEmail }
      : "skip"
  );

  // Check existing RSVP when email changes
  useEffect(() => {
    if (existingRSVP) {
      setFormData(prev => ({
        ...prev,
        attendeeName: existingRSVP.attendeeName,
        message: existingRSVP.message || "",
      }));
      setShowForm(false);
    } else if (formData.attendeeEmail) {
      setShowForm(true);
    }
  }, [existingRSVP]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await createRSVP({
        eventId,
        attendeeName: formData.attendeeName,
        attendeeEmail: formData.attendeeEmail,
        message: formData.message || undefined,
      });

      setSuccess(result.message);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!formData.attendeeEmail) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      await cancelRSVP({
        eventId,
        attendeeEmail: formData.attendeeEmail,
      });
      
      setSuccess("Your RSVP has been cancelled.");
      setFormData({ attendeeName: "", attendeeEmail: "", message: "" });
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP to {eventTitle}</h3>

      {/* RSVP Stats */}
      {rsvpStats && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{rsvpStats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            {rsvpStats.capacity && (
              <div>
                <div className="text-2xl font-bold text-gray-600">{rsvpStats.spotsRemaining}</div>
                <div className="text-sm text-gray-600">Spots Left</div>
              </div>
            )}
            {rsvpStats.waitlist > 0 && (
              <div>
                <div className="text-2xl font-bold text-yellow-600">{rsvpStats.waitlist}</div>
                <div className="text-sm text-gray-600">Waitlisted</div>
              </div>
            )}
            {rsvpStats.capacity && (
              <div>
                <div className="text-2xl font-bold text-gray-800">{rsvpStats.capacity}</div>
                <div className="text-sm text-gray-600">Total Capacity</div>
              </div>
            )}
          </div>
          
          {rsvpStats.isFull && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                Event is full - joining waitlist
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Existing RSVP Display */}
      {existingRSVP && !showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Your RSVP Status: {existingRSVP.status === "confirmed" ? "Confirmed ✓" : "Waitlisted"}
              </h4>
              <p className="text-sm text-blue-700">
                <strong>Name:</strong> {existingRSVP.attendeeName}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Email:</strong> {existingRSVP.attendeeEmail}
              </p>
              {existingRSVP.message && (
                <p className="text-sm text-blue-700 mt-1">
                  <strong>Message:</strong> {existingRSVP.message}
                </p>
              )}
            </div>
            
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
            >
              Cancel RSVP
            </button>
          </div>
        </div>
      )}

      {/* RSVP Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="attendeeName" className="block text-sm font-medium text-gray-700">
              Your Name *
            </label>
            <input
              type="text"
              id="attendeeName"
              value={formData.attendeeName}
              onChange={(e) => setFormData(prev => ({ ...prev, attendeeName: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="attendeeEmail" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              id="attendeeEmail"
              value={formData.attendeeEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, attendeeEmail: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message (Optional)
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any message for the organizers?"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting 
              ? "Submitting..." 
              : rsvpStats?.isFull 
                ? "Join Waitlist" 
                : "Confirm RSVP"
            }
          </button>

          {rsvpStats?.isFull && (
            <p className="text-sm text-gray-600 text-center">
              This event is at capacity, but you can join the waitlist. We'll notify you if a spot opens up!
            </p>
          )}
        </form>
      )}
    </div>
  );
}