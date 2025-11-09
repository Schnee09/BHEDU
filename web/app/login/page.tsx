"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import GuestGuard from "@/components/GuestGuard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setError(error.message);
    else {
      let userRole = data.user?.user_metadata?.role as string | undefined;
      if (!userRole) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user?.id)
          .single();
  userRole = (profileRow as { role?: unknown } | null)?.role as string | undefined;
      }

      if (userRole === "admin") router.replace("/dashboard");
      else if (userRole === "teacher") router.replace("/dashboard/classes");
      else router.replace("/dashboard");
    }

    setLoading(false);
  };

  const signInWithMagicLink = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) setError(error.message);
    else setMessage("Check your email for the magic link to sign in.");
    setLoading(false);
  };

  const signInDemo = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "password",
    });
    setLoading(false);

    if (error) setError(error.message);
    else router.replace("/dashboard");
  };

  return (
    <GuestGuard>
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          Welcome Back 👋
        </h2>

        <form onSubmit={signInWithPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              className="mt-1 w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex justify-between text-sm mt-2">
            <button
              type="button"
              onClick={signInWithMagicLink}
              className="text-blue-600 hover:underline"
            >
              Magic Link
            </button>
            <a
              href="/forgot-password"
              className="text-gray-600 hover:text-blue-600"
            >
              Forgot Password?
            </a>
          </div>

          <div className="text-center text-sm text-gray-500 mt-4">OR</div>

          <button
            type="button"
            onClick={signInDemo}
            disabled={loading}
            className="w-full py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md transition"
          >
            Demo Login
          </button>

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}
        </form>

        <p className="text-center text-sm mt-6 text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
    </GuestGuard>
  );
}
