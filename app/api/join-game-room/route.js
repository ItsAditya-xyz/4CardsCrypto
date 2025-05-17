// join-game-room (refactored from working original to support player_states schema)
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabaseServer";
import supabaseAdmin from "@/lib/supabaseAdmin";

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

  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
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

  const isStartingGame = updatedPlayers.length === 4;
  if (isStartingGame) {
    const fullDeck = [
      "1", "1", "1", "1",
      "2", "2", "2", "2",
      "3", "3", "3", "3",
      "4", "4", "4", "4",
      "0",
    ];

    for (let i = fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }

    const nullHolderIndex = Math.floor(Math.random() * 4);
    const playerStates = updatedPlayers.map((p) => ({
      user_id: p.id,
      hand: [],
      last_received: null,
    }));

    const nullIndex = fullDeck.indexOf("0");
    playerStates[nullHolderIndex].hand.push("0");
    fullDeck.splice(nullIndex, 1);

    const maxPerType = 2;
    const handLimits = Array(4).fill(0).map(() => ({}));
    let round = 0;
    let retries = 0;

    while (fullDeck.length > 0 && retries < 1000) {
      const i = round % 4;
      const player = playerStates[i];
      const limit = handLimits[i];
      const maxCards = i === nullHolderIndex ? 5 : 4;

      const card = fullDeck[0];
      const count = limit[card] || 0;

      if (player.hand.length < maxCards && count < maxPerType) {
        player.hand.push(card);
        limit[card] = count + 1;
        fullDeck.shift();
      }

      round++;
      retries++;
    }

    updatePayload.game_state = {
      turn_index: nullHolderIndex,
      last_passed_card: null,
      last_receiver_index: null,
    };
    updatePayload.status = "running";

    for (const p of playerStates) {
      const { data: exists } = await supabaseAdmin
        .from("player_states")
        .select("id")
        .eq("game_id", roomId)
        .eq("user_id", p.user_id)
        .single();

      if (!exists) {
        const { error: insertError } = await supabaseAdmin.from("player_states").insert({
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

  const { error: updateError } = await supabaseAdmin
    .from("game_rooms")
    .update(updatePayload)
    .eq("id", roomId);

  if (updateError) {
    console.error("Join or game init failed:", updateError);
    return NextResponse.json(
      { error: "Failed to join or init game" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Joined successfully" }, { status: 200 });
}
