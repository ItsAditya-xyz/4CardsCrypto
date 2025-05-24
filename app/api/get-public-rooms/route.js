// /app/api/get-public-rooms/route.js (Next.js App Router)

import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limitParam = parseInt(searchParams.get("limit") || "10");
  const limit = Math.min(limitParam, 50); // max limit 50

  const { data, error } = await supabase
    .from("game_rooms")
    .select("id, host_id, status, players, created_at")
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching game rooms:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms: data }, { status: 200 });
}
