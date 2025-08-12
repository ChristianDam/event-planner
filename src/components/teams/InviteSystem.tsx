"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TeamRole } from "@/lib/types";

interface InviteSystemProps {
  teamId: Id<"teams">;
}

export function InviteSystem({ teamId }: InviteSystemProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    role: "member" as TeamRole,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const invites = useQuery(api.invites.getTeamInvites, { teamId });
  const createInvite = useMutation(api.invites.createInvite);
  const cancelInvite = useMutation(api.invites.cancelInvite);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await createInvite({
        teamId,
        email: inviteData.email.toLowerCase().trim(),
        role: inviteData.role as "admin" | "member",
      });

      setSuccess(`Invitation sent! Share this link: ${window.location.origin}${result.inviteUrl}`);
      setInviteData({ email: "", role: "member" });
      setShowInviteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId: Id<"teamInvites">) => {
    try {
      await cancelInvite({ inviteId });
      setSuccess("Invitation cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invite");
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setSuccess("Invite link copied to clipboard!");
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          {success}
          <button
            onClick={() => setSuccess("")}
            className="ml-2 text-green-800 hover:text-green-900"
          >
            ✕
          </button>
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Invite Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Invitations</h3>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                value={inviteData.role}
                onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value as TeamRole }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Invites */}
      {invites && invites.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Pending Invitations</h4>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {invites.map((invite) => (
                <li key={invite._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invite.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        Role: {invite.role} • Invited by {invite.inviter?.name} • 
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyInviteLink(invite.inviteCode)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleCancelInvite(invite._id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}