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

  const { data: state, error: fetchError } = await supabase
    .from("player_states")
    .select("hand, last_received")
    .eq("game_id", roomId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !state) {
    return NextResponse.json(
      { error: "Could not fetch your hand" },
      { status: 404 }
    );
  }

  return NextResponse.json(state, { status: 200 });
}
