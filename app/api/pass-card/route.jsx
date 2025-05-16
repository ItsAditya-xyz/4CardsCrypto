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

  const { roomId, card } = await req.json();

  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const gameState = room.game_state;
  const players = structuredClone(gameState.players); // 🔒 Prevent mutation bugs
  const currentIndex = gameState.turn_index;
  const currentPlayer = players[currentIndex];

  if (room.status === "completed") {
    return NextResponse.json(
      { error: "Game has already ended." },
      { status: 400 }
    );
  }

  // 🚫 Only room players can act
  if (!players.some(p => p.user_id === user.id)) {
    return NextResponse.json({ error: "You are not a player in this room" }, { status: 403 });
  }

  // 🚫 Only current player can act
  if (currentPlayer.user_id !== user.id) {
    return NextResponse.json({ error: "Not your turn" }, { status: 403 });
  }

  const hand = currentPlayer.hand;
  const cardCount = hand.filter((c) => c === card).length;
  const isFirstMove = gameState.last_passed_card === null;

  // 🛑 Null Rule
  if (isFirstMove && card === "0") {
    return NextResponse.json(
      { error: "Cannot pass '0' on first move" },
      { status: 400 }
    );
  }

  // 🔁 Repeat Block Rule
  if (currentPlayer.last_received === card && cardCount < 2) {
    return NextResponse.json(
      {
        error:
          "Cannot pass back the card you just received unless you have more than one",
      },
      { status: 400 }
    );
  }

  // 🃏 Validate player has the card
  const cardIndex = hand.indexOf(card);
  if (cardIndex === -1) {
    return NextResponse.json({ error: "Card not in hand" }, { status: 400 });
  }

  // 🧠 Compute next player
  const nextIndex = (currentIndex + 1) % players.length;
  const nextPlayer = players[nextIndex];

  // ✂️ Remove card from sender
  currentPlayer.hand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];

  // ➕ Add card to receiver
  nextPlayer.hand.push(card);
  nextPlayer.last_received = card;

  // 🏆 Check win condition
  const counts = nextPlayer.hand.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  const winner = Object.values(counts).some((count) => count === 4);

  // ♻️ Update state
  const newGameState = {
    ...gameState,
    turn_index: nextIndex,
    last_passed_card: card,
    last_receiver_index: nextIndex,
    last_sender_index: currentIndex,
    players,
  };

  const updatePayload = {
    game_state: newGameState,
    ...(winner && { status: "completed" }),
  };

  const { error: updateError } = await supabase
  .from("game_rooms")
  .update(updatePayload)
  .eq("id", roomId)
  .filter("game_state->>turn_index", "eq", String(currentIndex)); // ✅ Fixed

  if (updateError) {
    console.error("Error updating game room:", updateError);
    return NextResponse.json(
      { error: "Failed to update game" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      message: "Card passed successfully",
      status: winner ? "completed" : "running",
      game_state: newGameState,
    },
    { status: 200 }
  );
}
