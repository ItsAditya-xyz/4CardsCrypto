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

  // Fetch current room
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
    return NextResponse.json(
      { message: "User already in room" },
      { status: 200 }
    );
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
  let gameState = null;

  // If this is the 4th player, generate the game_state
  if (updatedPlayers.length === 4) {
    const fullDeck = [
      "1",
      "1",
      "1",
      "1",
      "2",
      "2",
      "2",
      "2",
      "3",
      "3",
      "3",
      "3",
      "4",
      "4",
      "4",
      "4",
      "0",
    ];

    // Shuffle deck
    for (let i = fullDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
    }

    // Pick a random starting player to get the "0" card
    const nullHolderIndex = Math.floor(Math.random() * 4);
    const playersWithCards = updatedPlayers.map((p) => ({
      user_id: p.id,
      hand: [],
      last_received: null, // ✅ initializing here
    }));
    // Give the "0" card to the chosen player
    const nullIndex = fullDeck.indexOf("0");
    playersWithCards[nullHolderIndex].hand.push("0");
    fullDeck.splice(nullIndex, 1); // Remove "0" from deck

    // Deal cards
    const maxPerType = 2;
    const handLimits = Array(4)
      .fill(0)
      .map(() => ({}));

    let round = 0;
    while (fullDeck.length > 0) {
      const currentPlayer = round % 4;
      const hand = playersWithCards[currentPlayer].hand;
      const limit = handLimits[currentPlayer];

      if (
        (nullHolderIndex === currentPlayer && hand.length >= 5) ||
        (nullHolderIndex !== currentPlayer && hand.length >= 4)
      ) {
        round++;
        continue;
      }

      const card = fullDeck[0];
      const count = limit[card] || 0;

      if (count >= maxPerType) {
        round++;
        continue;
      }

      // Assign card
      hand.push(card);
      limit[card] = count + 1;
      fullDeck.shift(); // remove card from deck
      round++;
    }

    gameState = {
      turn_index: nullHolderIndex,
      last_passed_card: null,
      last_receiver_index: null,
      players: playersWithCards,
    };

    updatePayload.game_state = gameState;
    updatePayload.status = "running";
  }

  const { error: updateError } = await supabase
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

  // Filter game state to only expose current user's hand
  let filteredGameState = gameState;
  if (gameState) {
    filteredGameState = {
      ...gameState,
      players: gameState.players.map((p) =>
        p.user_id === user.id
          ? p
          : {
              ...p,
              hand: Array(p.hand.length).fill(null),
            }
      ),
    };
  }

  return NextResponse.json(
    { message: "Joined successfully", game_state: filteredGameState },
    { status: 200 }
  );
}
