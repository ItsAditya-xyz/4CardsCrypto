import { NextResponse } from "next/server";
import supabase from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("game_rooms")
    .select("id, host_id, players, winner_id, card_collected, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20)
    .filter("players", "cs", JSON.stringify([{ id: userId }]));

  if (error) {
    console.error("Failed to fetch game rooms for player:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rooms: data }, { status: 200 });
}
