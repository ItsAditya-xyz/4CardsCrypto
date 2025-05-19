// app/api/get-all-cards/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import supabaseAdmin from "@/lib/supabaseAdmin";

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roomId } = await req.json();

  // Get game room
  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  if (room.status !== "completed") {
    return NextResponse.json({ error: "Game is not completed" }, { status: 403 });
  }

  // Get all player hands
  const { data: playerStates, error: psError } = await supabaseAdmin
    .from("player_states")
    .select("user_id, hand, last_received")
    .eq("game_id", roomId);

  if (psError || !playerStates) {
    return NextResponse.json({ error: "Failed to fetch player states" }, { status: 500 });
  }

  // Find winner
  let winner = null;
  for (const player of playerStates) {
    const counts = {};
    for (const card of player.hand) {
      if (card === "0") continue;
      counts[card] = (counts[card] || 0) + 1;
    }
    if (Object.values(counts).includes(4)) {
      winner = player.user_id;
      break;
    }
  }

  return NextResponse.json({
    players: playerStates,
    winner,
  });
}
