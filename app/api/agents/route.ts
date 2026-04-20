import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return NextResponse.json(
        { error: "Missing Supabase public env vars" },
        { status: 500 }
      );
    }
    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let q = supabase
      .from("agents")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(48);

    if (category) {
      q = q.eq("category", category);
    }

    const { data, error } = await q;
    if (error) {
      // Keep marketplace usable before schema is applied.
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("schema cache") ||
        error.message.includes("Could not find the table")
      ) {
        return NextResponse.json({ agents: [], warning: error.message });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ agents: data ?? [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
