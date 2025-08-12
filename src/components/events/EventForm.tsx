"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Id } from "../../../convex/_generated/dataModel";
import { Event } from "@/lib/types";

interface EventFormProps {
  teamId: Id<"teams">;
  teamSlug: string;
  event?: Event;
  mode: "create" | "edit";
}

interface LocationData {
  address: string;
  venue?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export function EventForm({ teamId, teamSlug, event, mode }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    startDate: event?.startDate 
      ? new Date(event.startDate).toISOString().slice(0, 16)
      : "",
    endDate: event?.endDate
      ? new Date(event.endDate).toISOString().slice(0, 16)
      : "",
    address: event?.location.address || "",
    venue: event?.location.venue || "",
    capacity: event?.capacity?.toString() || "",
    status: event?.status || "draft" as "draft" | "published",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const createEvent = useMutation(api.events.create);
  const updateEvent = useMutation(api.events.update);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Event title is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Event description is required");
      }
      if (!formData.startDate) {
        throw new Error("Start date is required");
      }
      if (!formData.endDate) {
        throw new Error("End date is required");
      }
      if (!formData.address.trim()) {
        throw new Error("Event address is required");
      }

      const startDate = new Date(formData.startDate).getTime();
      const endDate = new Date(formData.endDate).getTime();

      if (endDate <= startDate) {
        throw new Error("End date must be after start date");
      }

      if (startDate <= Date.now()) {
        throw new Error("Event cannot start in the past");
      }

      const location: LocationData = {
        address: formData.address.trim(),
      };

      if (formData.venue.trim()) {
        location.venue = formData.venue.trim();
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate,
        endDate,
        location,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: formData.status,
      };

      if (mode === "create") {
        const result = await createEvent({
          teamId,
          ...eventData,
        });
        router.push(`/${teamSlug}/${result.slug}`);
      } else if (mode === "edit" && event) {
        await updateEvent({
          eventId: event._id,
          ...eventData,
        });
        router.push(`/${teamSlug}/${event.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateForInput = (timestamp: number) => {
    return new Date(timestamp).toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow rounded-lg p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {mode === "create" ? "Create New Event" : "Edit Event"}
          </h2>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your event title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your event..."
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
              Venue Name
            </label>
            <input
              type="text"
              id="venue"
              value={formData.venue}
              onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., The Art Gallery, Community Center"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address *
            </label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Full street address"
            />
          </div>

          {/* Capacity */}
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Capacity (Optional)
            </label>
            <input
              type="number"
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              min="1"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Maximum number of attendees"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "draft" | "published" }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="draft">Draft (not visible to public)</option>
              <option value="published">Published (visible to public)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting 
              ? (mode === "create" ? "Creating..." : "Saving...")
              : (mode === "create" ? "Create Event" : "Save Changes")
            }
          </button>
          
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${teamSlug}`)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}