// ai_analysis_trigger - iterate students, call generate_ai_insight internally (Deno)
import { serve } from "std/server";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUNCTION_URL = Deno.env.get("GENERATE_AI_INSIGHT_URL")!; // full URL to deployed function

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    // Fetch students list (could be paginated)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.student`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    if (!res.ok) throw new Error(`Failed to fetch students: ${res.status}`);
    const students = await res.json();

    const results = [];
    for (const s of students) {
      try {
        const call = await fetch(FUNCTION_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` // call as service
          },
          body: JSON.stringify({ student_id: s.id, source: "scheduled_weekly" })
        });
        const json = await call.json();
        results.push({ student: s.id, ok: true, resp: json });
      } catch (e) {
        results.push({ student: s.id, ok: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
