// get-game-room (fixed for null-safe game_state)
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

  const { roomId } = await req.json();

  const { data: room, error: roomError } = await supabase
    .from("game_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    console.log("Room not found:", roomError);
    return NextResponse.json({ error: "Game room not found" }, { status: 404 });
  }

  const safeRoom = {
    ...room,
    game_state: room.game_state || {},
  };

  return NextResponse.json({ gameRoom: safeRoom }, { status: 200 });
}
