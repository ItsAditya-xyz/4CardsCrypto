import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roomId } = await req.json();

  // Get room to check game status
  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("id, status")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  const { data: playerStates, error: statesError } = await supabase
    .from("player_states")
    .select("user_id, hand, last_received")
    .eq("game_id", roomId);

  if (statesError) {
    return NextResponse.json({ error: "Failed to fetch player states" }, { status: 500 });
  }

  // Redact hand data unless it's the current user or the game is completed
  const safeStates = playerStates.map((ps) => {
    if (ps.user_id === user.id || room.status === "completed") {
      return ps;
    }

    return {
      user_id: ps.user_id,
      hand: Array(ps.hand.length).fill(null),
      last_received: null,
    };
  });

  return NextResponse.json({ playerStates: safeStates }, { status: 200 });
}
