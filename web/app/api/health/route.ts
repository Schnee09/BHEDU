import { NextResponse } from "next/server";

export async function GET() {
  try {
    const start = Date.now();
    const res = await fetch("https://www.google.com", { method: "HEAD" });
    const duration = Date.now() - start;

    let supabaseRes = null;
    try {
      const sStart = Date.now();
      const sURL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "missing") +
        "/rest/v1/";
      const sRes = await fetch(sURL, {
        method: "GET",
        headers: { "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "" },
      });
      supabaseRes = {
        status: sRes.status,
        durationMs: Date.now() - sStart,
        url: sURL,
      };
    } catch (sErr: any) {
      supabaseRes = {
        error: sErr.message,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      };
    }

    return NextResponse.json({
      status: "ok",
      googleStatus: res.status,
      googleDurationMs: duration,
      supabase: supabaseRes,
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message,
      stack: err.stack,
      nodeVersion: process.version,
    }, { status: 500 });
  }
}
