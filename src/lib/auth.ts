import { useAuthActions as useConvexAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  return useQuery(api.users.current);
}

export function useAuthActions() {
  const { signIn, signOut } = useConvexAuthActions();

  const signInWithPassword = async (email: string, password: string) => {
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (error) {
      throw new Error("Invalid email or password");
    }
  };

  const signUpWithPassword = async (email: string, password: string, name: string) => {
    try {
      await signIn("password", { email, password, name, flow: "signUp" });
    } catch (error) {
      throw new Error("Failed to create account");
    }
  };

  return {
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
}