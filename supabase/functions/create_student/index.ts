import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  try {
    const { email, full_name } = await req.json();
    if (!email || !full_name) {
      return new Response("Missing email or full_name", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1️⃣ Create the Auth user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: "12345678", // default password or generate random
      email_confirm: true,
    });
    if (userError) throw userError;

    // 2️⃣ Insert into profiles
    const userId = userData.user.id;
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      full_name,
      role: "student",
    });
    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, id: userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
