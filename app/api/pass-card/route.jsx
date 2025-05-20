import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import supabaseAdmin from "@/lib/supabaseAdmin";

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

  // Fetch game room
  const { data: room, error: roomError } = await supabaseAdmin
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status === "completed") {
    return NextResponse.json({ error: "Game already completed" }, { status: 400 });
  }

  const gameState = room.game_state;
  const playersOrdered = room.players.map((p) => p.id);
  const currentIndex = gameState.turn_index;
  const currentUserId = playersOrdered[currentIndex];

  if (user.id !== currentUserId) {
    return NextResponse.json({ error: "Not your turn" }, { status: 403 });
  }

  // Fetch all 4 player states
  const { data: playerStates, error: psError } = await supabaseAdmin
    .from("player_states")
    .select("*")
    .eq("game_id", roomId);

  if (psError || !playerStates || playerStates.length !== 4) {
    console.log("Player states error:", psError);
    console.log("Player states:", playerStates);

    return NextResponse.json({ error: "Invalid player states" }, { status: 500 });
  }

  const currentPlayer = playerStates.find((p) => p.user_id === user.id);
  const nextIndex = (currentIndex + 1) % 4;
  const nextUserId = playersOrdered[nextIndex];
  const nextPlayer = playerStates.find((p) => p.user_id === nextUserId);

  const hand = currentPlayer.hand;
  const cardCount = hand.filter((c) => c === card).length;
  const isFirstMove = gameState.last_passed_card === null;

  // ❌ Rule: Cannot pass 0 on first move
  if (isFirstMove && card === "0") {
    return NextResponse.json({ error: "Cannot pass '0' on first move" }, { status: 400 });
  }

  // ❌ Rule: Cannot pass back last received card unless holding >1
  if (currentPlayer.last_received === card && cardCount < 2) {
    return NextResponse.json({
      error: "Can't pass back the card you just received unless you have more than one",
    }, { status: 400 });
  }

  // ❌ Rule: Must have the card
  const cardIndex = hand.indexOf(card);
  if (cardIndex === -1) {
    return NextResponse.json({ error: "Card not in hand" }, { status: 400 });
  }

  // ✅ Move card
  const newSenderHand = [...hand.slice(0, cardIndex), ...hand.slice(cardIndex + 1)];
  const newReceiverHand = [...nextPlayer.hand, card];

  // 🏆 Check win
  const counts = newReceiverHand.reduce((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const hasWon = Object.values(counts).some((n) => n === 4);

  // 🔁 Update both player states
  const { error: senderErr } = await supabaseAdmin
    .from("player_states")
    .update({ hand: newSenderHand })
    .eq("game_id", roomId)
    .eq("user_id", currentPlayer.user_id);

  const { error: receiverErr } = await supabaseAdmin
    .from("player_states")
    .update({
      hand: newReceiverHand,
      last_received: card,
    })
    .eq("game_id", roomId)
    .eq("user_id", nextPlayer.user_id);

  if (senderErr || receiverErr) {
    console.error("Update error:", senderErr || receiverErr);
    return NextResponse.json({ error: "Failed to pass card" }, { status: 500 });
  }

  // 🧠 Update game state
  const newGameState = {
    ...gameState,
    turn_index: nextIndex,
    last_passed_card: card,
    last_receiver_index: nextIndex,
    last_sender_index: currentIndex,
  };

  const { error: gameUpdateError } = await supabaseAdmin
    .from("game_rooms")
    .update({
      game_state: newGameState,
      ...(hasWon && { status: "completed" }),
    })
    .eq("id", roomId)
    .filter("game_state->>turn_index", "eq", String(currentIndex)); // safe concurrent updates

  if (gameUpdateError) {
    console.error("Game state update failed:", gameUpdateError);
    return NextResponse.json({ error: "Failed to update game state" }, { status: 500 });
  }

  return NextResponse.json({
    message: "Card passed successfully",
    status: hasWon ? "completed" : "running",
  });
}
