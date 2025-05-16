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

  // Fetch game room
  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  // Safely sanitize game_state if it exists and has players
  let safeGameState = null;

  if (room.game_state && Array.isArray(room.game_state.players)) {
    safeGameState = {
      ...room.game_state,
      players: room.game_state.players.map((p) => {
        if (p.user_id === user.id) return p;
        return {
          ...p,
          hand: Array.isArray(p.hand) ? Array(p.hand.length).fill(null) : [],
        };
      }),
    };
  }

  const safeRoom = {
    ...room,
    game_state: safeGameState,
  };

  return NextResponse.json({ gameRoom: safeRoom }, { status: 200 });
}
