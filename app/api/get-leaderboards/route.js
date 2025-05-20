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
  const limit = parseInt(searchParams.get("limit") || "100");

  // Step 1: Get game winners
  const { data: games, error: gamesError } = await supabaseAdmin
    .from("game_rooms")
    .select("winner_id, card_collected")
    .not("winner_id", "is", null);

  if (gamesError) {
    console.error("Error fetching game_rooms:", gamesError);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 }
    );
  }

  // Step 2: Aggregate scores
  const scoreMap = {};
  for (const { winner_id, card_collected } of games) {
    const points = CARD_POINTS[card_collected] || 0;
    scoreMap[winner_id] = (scoreMap[winner_id] || 0) + points;
  }

  // Step 3: Sort and slice top players
  const sorted = Object.entries(scoreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const winnerIds = sorted.map(([id]) => id);

  // Step 4: Fetch player info from "players" table
  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id, user_name, full_name, avatar_url, created_at, last_login")
    .in("id", winnerIds);

  if (playersError) {
    console.error("Failed to fetch player info", playersError);
    return NextResponse.json(
      { error: "Failed to fetch player info" },
      { status: 500 }
    );
  }

  const playerMap = {};
  for (const player of players) {
    playerMap[player.id] = player;
  }

  // Step 5: Compose final leaderboard
  const leaderboard = sorted
    .map(([id, points]) => ({
      id,
      points,
      ...playerMap[id],
    }))
    .filter((p) => p.user_name); // filter out missing players (edge case)

  return NextResponse.json({ leaderboard });
}
