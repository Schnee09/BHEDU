"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AuthState = {
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  cookies: string;
};

export default function ClearOldAuthPage() {
  const [preview, setPreview] = useState<string>("Loading...");
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Show current auth-related storage/cookies
    const state: AuthState = { localStorage: {}, sessionStorage: {}, cookies: document.cookie || "none" };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)!;
        if (key.toLowerCase().includes("supabase") || key.toLowerCase().includes("auth")) {
          state.localStorage[key] = (localStorage.getItem(key) ?? "").slice(0, 80) + "...";
        }
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)!;
        if (key.toLowerCase().includes("supabase") || key.toLowerCase().includes("auth")) {
          state.sessionStorage[key] = (sessionStorage.getItem(key) ?? "").slice(0, 80) + "...";
        }
      }
    } catch {}

    setPreview(JSON.stringify(state, null, 2));
  }, []);

  const clearAll = async () => {
    try {
      // First, call server logout API to clear server-side session
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (logoutErr) {
        console.warn('Server logout failed:', logoutErr);
      }

      // Clear localStorage/sessionStorage fully
      try { localStorage.clear(); } catch {}
      try { sessionStorage.clear(); } catch {}

      // Best-effort: clear non-httpOnly cookies (httpOnly cookies cannot be cleared from JS)
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const [name] = cookie.split("=");
        const c = name?.trim();
        if (!c) return;
        document.cookie = `${c}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      });

      setDone(true);

      // Redirect to login for fresh cookie-based session
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (e) {
       
      console.error(e);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Clear Old Auth Session</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        We migrated authentication to cookie-based sessions. If you see 400 token errors or 500s on API routes, clear old
        localStorage tokens and re-login.
      </p>

      <div style={{ background: "#fff3e0", borderLeft: "4px solid #ff9800", padding: 12, borderRadius: 6, marginBottom: 16 }}>
        This will remove old localStorage and sessionStorage entries. It also attempts to clear non-httpOnly cookies. After this,
        you&apos;ll be redirected to the login page.
      </div>

      <button onClick={clearAll} style={{ background: "#2563eb", color: "#fff", border: 0, padding: "10px 16px", borderRadius: 6, cursor: "pointer" }}>
        Clear All Auth Data & Redirect to Login
      </button>

      {done && (
        <div style={{ marginTop: 16, background: "#e8f5e9", borderLeft: "4px solid #4caf50", padding: 12, borderRadius: 6 }}>
          Cleared! Redirecting to login...
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Current Auth-related Storage</h3>
      <pre style={{ background: "#f5f5f5", padding: 12, borderRadius: 6, overflowX: "auto" }}>{preview}</pre>

      <p style={{ marginTop: 16, color: "#666" }}>
        Alternatively, open a <strong>private/incognito window</strong> and log in fresh.
      </p>

      <p style={{ marginTop: 8 }}>
        Back to <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
