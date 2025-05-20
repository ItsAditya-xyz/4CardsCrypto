// /app/api/get-user-by-name/route.js
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

const CARD_POINTS = {
  4: 1000,
  3: 800,
  2: 700,
  1: 500,
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  // Step 1: Fetch user from players table
  const { data: player, error: playerError } = await supabaseAdmin
    .from("players")
    .select("*")
    .eq("user_name", username)
    .single();

  if (playerError || !player) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Step 2: Fetch wins from game_rooms
  const { data: wins, error: winsError } = await supabaseAdmin
    .from("game_rooms")
    .select("card_collected")
    .eq("winner_id", player.id);

  if (winsError) {
    console.error("Failed to fetch wins:", winsError);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }

  const games_won = wins.length;
  const points = wins.reduce((total, win) => {
    return total + (CARD_POINTS[win.card_collected] || 0);
  }, 0);

  return NextResponse.json({
    ...player,
    games_won,
    points,
  });
}
