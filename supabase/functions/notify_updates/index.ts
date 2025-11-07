// notify_updates - send notification records (and optionally push via FCM)
import { serve } from "std/server";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVER_KEY = Deno.env.get("FCM_SERVER_KEY"); // optional

async function storeNotification(target_id, title, message) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify({ target_id, title, message })
  });
  return res.json();
}

async function sendFCM(token, title, body) {
  if (!FCM_SERVER_KEY || !token) return null;
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${FCM_SERVER_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body }
    })
  });
  return res.json();
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const body = await req.json();
    const { target_id, title, message, push_token } = body;
    if (!target_id || !title || !message) return new Response(JSON.stringify({ error: "missing fields" }), { status: 400 });

    const stored = await storeNotification(target_id, title, message);
    let pushRes = null;
    if (push_token) {
      pushRes = await sendFCM(push_token, title, message);
    }

    return new Response(JSON.stringify({ ok: true, stored, pushRes }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
