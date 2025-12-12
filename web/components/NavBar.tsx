"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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
  const { data } = await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
        if (!cancelled && data && (data as Record<string, unknown>).role) setRole((data as Record<string, unknown>).role as string);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    location.href = "/";
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-stone-800 text-white',
      teacher: 'bg-green-600 text-white',
      student: 'bg-orange-500 text-white',
    };
    return badges[role as keyof typeof badges] || 'bg-stone-200 text-stone-800';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm">
      {/* Skip to Main Content - Accessibility */}
      <a href="#main-content" className="skip-to-main sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-stone-900 focus:text-white focus:rounded-lg focus:shadow-lg">
        Skip to main content
      </a>
      
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main navigation">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 font-heading font-bold text-xl text-stone-900 hover:text-stone-700 transition-all"
            aria-label="BH EDU Home"
          >
            <svg className="w-8 h-8 text-stone-900" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
            BH EDU
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all"
              aria-label="Go to Dashboard"
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/courses" 
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all"
              aria-label="Go to Admin Panel"
            >
              Admin
            </Link>
            {(role === 'teacher' || role === 'admin') && (
              <Link 
                href="/dashboard/grades/vietnamese-entry" 
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                aria-label="Enter grades"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Nhập điểm
              </Link>
            )}
          </div>
        </div>
        
        {/* User Section */}
        <div className="flex items-center gap-3">
          {email ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-stone-600 truncate max-w-[180px]" aria-label={`Logged in as ${email}`}>{email}</span>
                {role && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadge(role)} shadow-sm`} aria-label={`User role: ${role}`}>
                    {role}
                  </span>
                )}
              </div>
              <button 
                onClick={signOut} 
                className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                aria-label="Sign out of your account"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Sign in to your account"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
