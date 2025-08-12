import { useAuthActions } from "@convex-dev/auth/react";

export { useCurrentUser } from "@convex-dev/auth/react";

export function useAuthActions() {
  const { signIn, signOut } = useAuthActions();

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