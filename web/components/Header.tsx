"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function Header({ profile }: { profile: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="font-semibold text-lg">Dashboard</h2>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          {profile?.full_name || "User"}{" "}
          <span className="text-gray-400">({profile?.role || "student"})</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-md transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
