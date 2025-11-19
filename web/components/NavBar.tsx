"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (user && !cancelled) {
        setEmail(user.email ?? null);
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (!cancelled && data && (data as Record<string, unknown>).role) setRole((data as Record<string, unknown>).role as string);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  return (
    <header className="border-b">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">BH EDU</Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">Dashboard</Link>
          <Link href="/dashboard/courses" className="text-sm text-gray-500 hover:text-gray-800">Admin</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {email ? (
            <>
              <span className="text-gray-500 truncate max-w-[200px]">{email} {role ? `• ${role}` : ''}</span>
              <button onClick={signOut} className="px-3 py-1 rounded bg-gray-800 text-white">Sign out</button>
            </>
          ) : (
            <Link href="/login" className="px-3 py-1 rounded bg-blue-600 text-white">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
