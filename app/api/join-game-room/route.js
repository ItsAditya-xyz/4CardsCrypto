// app/api/join-game-room/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { roomId } = await req.json();

  const { data: room, error: fetchError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (fetchError || !room) {
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  // Room full check
  if (room.players.length >= 4) {
    return NextResponse.json({ error: "Room is full" }, { status: 403 });
  }

  // Already joined check
  const alreadyJoined = room.players.some((p) => p.id === user.id);
  if (alreadyJoined) {
    return NextResponse.json({ message: "User already in room" }, { status: 200 });
  }

  const newPlayer = {
    id: user.id,
    user_name: user.user_metadata?.user_name || "Anon",
    full_name: user.user_metadata?.full_name || "Anon",
    avatar_url: user.user_metadata?.avatar_url || "/default-pfp.png",
  };

  const updatedPlayers = [...room.players, newPlayer];

  const { error: updateError } = await supabase
    .from("game_rooms")
    .update({ players: updatedPlayers })
    .eq("id", roomId);

  if (updateError) {
    console.error("Update failed:", updateError);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }

  return NextResponse.json({ message: "Joined successfully" }, { status: 200 });
}
