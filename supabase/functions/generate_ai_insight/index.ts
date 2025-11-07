// index.ts (Supabase Edge Function - Deno)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error("Missing env vars for generate_ai_insight");
}

async function fetchMetrics(student_id: string) {
  const res = await fetch(`${SUPABASE_URL}/rpc/get_student_metrics`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ p_student_id: student_id })
  });
  if (!res.ok) throw new Error(`Metrics fetch failed: ${res.status}`);
  return await res.json();
}

async function callLLM(prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.15,
      max_tokens: 900
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM error: ${res.status} ${txt}`);
  }
  return await res.json();
}

async function storeInsight(student_id: string, source: string, summary: string, recommendations: any, risk_score: number|null, insight_data: any) {
  const payload = {
    student_id,
    source,
    summary,
    recommendations,
    risk_score,
    insight_data
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_feedback`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to store ai_feedback: ${res.status} ${txt}`);
  }
  return await res.json();
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const body = await req.json();
    const student_id = body.student_id;
    const source = body.source ?? "manual";

    if (!student_id) return new Response(JSON.stringify({ error: "student_id required" }), { status: 400 });

    const metrics = await fetchMetrics(student_id);

    const prompt = `
You are an education analytics assistant. Input: JSON metrics. Output ONLY a JSON object with keys:
- summary: short 1-2 paragraph summary (string)
- recommendations: array of short actionable recommendations (max 5)
- risk_score: number between 0 and 1
Do not include any extra commentary.

Metrics: ${JSON.stringify(metrics)}
`;

    const llmResp = await callLLM(prompt);
    const content = llmResp?.choices?.[0]?.message?.content ?? llmResp?.choices?.[0]?.text ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // fallback wrap
      parsed = { summary: content, recommendations: [], risk_score: null };
    }

    const store = await storeInsight(student_id, source, parsed.summary ?? parsed.text ?? "", parsed.recommendations ?? [], parsed.risk_score ?? null, metrics);

    return new Response(JSON.stringify({ ok: true, insight: parsed, stored: store }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
