"use client";

import Link from "next/link";
import { Team, TeamRole } from "@/lib/types";

interface TeamCardProps {
  team: Team & { role: TeamRole; joinedAt: number };
}

export function TeamCard({ team }: TeamCardProps) {
  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <Link
      href={`/dashboard/${team.slug}`}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {team.name}
          </h3>
          {team.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {team.description}
            </p>
          )}
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
              team.role
            )}`}
          >
            {team.role}
          </span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Joined {new Date(team.joinedAt).toLocaleDateString()}
      </div>
    </Link>
  );
}