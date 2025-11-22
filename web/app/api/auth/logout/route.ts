import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = createClient();
    
    // Sign out to clear server-side session
    await supabase.auth.signOut();
    
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Logout failed" },
      { status: 500 }
    );
  }
}
