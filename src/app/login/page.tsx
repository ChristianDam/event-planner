import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

function LoginContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
          Creative Events
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Welcome back! Sign in to your account.
        </p>
      </div>
      
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}