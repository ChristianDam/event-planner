"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Suspense } from "react";

interface JoinTeamContentProps {
  code: string;
}

function JoinTeamContent({ code }: JoinTeamContentProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const user = useCurrentUser();
  const invite = useQuery(api.invites.getInviteByCode, { code });
  const acceptInvite = useMutation(api.invites.acceptInviteExistingUser);
  const router = useRouter();
  const searchParams = useSearchParams();

  const justRegistered = searchParams.get("registered") === "true";

  useEffect(() => {
    if (user && invite && justRegistered) {
      // Auto-accept invite after successful registration
      handleAcceptInvite();
    }
  }, [user, invite, justRegistered]);

  const handleAcceptInvite = async () => {
    if (!user || !invite) return;

    setAccepting(true);
    setError("");

    try {
      const result = await acceptInvite({ code });
      setSuccess(true);
      
      setTimeout(() => {
        router.push(`/dashboard/${result.teamSlug}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (invite === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-green-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to the Team!</h2>
            <p className="text-gray-600 mb-4">
              You have successfully joined <strong>{invite.team?.name}</strong> as a {invite.role}.
            </p>
            <p className="text-sm text-gray-500">Redirecting to team dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            Join {invite.team?.name}
          </h1>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{invite.inviter?.name}</strong> has invited you to join
              </p>
              <h3 className="text-lg font-semibold text-gray-900">{invite.team?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">as a {invite.role}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                !showLogin
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg ${
                showLogin
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        {showLogin ? (
          <LoginForm inviteCode={code} />
        ) : (
          <SignUpForm inviteCode={code} inviteEmail={invite.email} />
        )}
      </div>
    );
  }

  // User is authenticated, show accept/decline options
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Team Invitation</h2>
            <p className="text-sm text-gray-600 mb-4">
              <strong>{invite.inviter?.name}</strong> has invited you to join
            </p>
            <h3 className="text-lg font-semibold text-gray-900">{invite.team?.name}</h3>
            <p className="text-sm text-gray-500 mt-1">as a {invite.role}</p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? "Joining..." : "Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function JoinTeamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinTeamContent code={code} />
    </Suspense>
  );
}