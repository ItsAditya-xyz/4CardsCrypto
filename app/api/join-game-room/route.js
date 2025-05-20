// app/api/join-game-room/route.js
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabaseServer";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { distributeCards } from "@/lib/distributeCards";

export async function POST(req) {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roomId } = await req.json();

  const { data: room, error: roomError } = await supabaseAdmin
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    console.log("Room not found:", roomError);
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  const alreadyInRoom = room.players.some((p) => p.id === user.id);
  if (alreadyInRoom) {
    return NextResponse.json({ message: "User already in room" }, { status: 200 });
  }

  if (room.players.length >= 4) {
    return NextResponse.json({ error: "Room is full" }, { status: 403 });
  }

  const newPlayer = {
    id: user.id,
    user_name: user.user_metadata?.user_name || "Anon",
    full_name: user.user_metadata?.full_name || "Anon",
    avatar_url: user.user_metadata?.avatar_url || "/default-pfp.png",
  };

  const updatedPlayers = [...room.players, newPlayer];
  const updatePayload = { players: updatedPlayers };

  // Only start game if this is the 4th player AND game not already initialized
  if (updatedPlayers.length === 4 && !room.game_initialized) {
    const { playerStates, turnIndex } = distributeCards(updatedPlayers);

    updatePayload.game_state = {
      turn_index: turnIndex,
      last_passed_card: null,
      last_receiver_index: null,
    };
    updatePayload.status = "running";
    updatePayload.game_initialized = true;

    // Insert player_states
    for (const p of playerStates) {
      const { data: exists } = await supabaseAdmin
        .from("player_states")
        .select("id")
        .eq("game_id", roomId)
        .eq("user_id", p.user_id)
        .single();

      if (!exists) {
        const { error: insertError } = await supabaseAdmin
          .from("player_states")
          .insert({
            game_id: roomId,
            user_id: p.user_id,
            hand: p.hand,
            last_received: p.last_received,
          });

        if (insertError) {
          console.error("Failed to insert player_state for", p.user_id, insertError);
        }
      }
    }
  }

  // Final DB update (only if game hasn't been initialized already)
  const { error: updateError } = await supabaseAdmin
    .from("game_rooms")
    .update(updatePayload)
    .eq("id", roomId)
    .eq("game_initialized", false); // ✅ ensures only one init happens

  if (updateError) {
    console.error("Join or game init failed:", updateError);
    return NextResponse.json(
      { error: "Failed to join or init game" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Joined successfully" }, { status: 200 });
}
