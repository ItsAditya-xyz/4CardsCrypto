// app/api/create-room/route.js
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabaseServer"
import supabaseAdmin from "@/lib/supabaseAdmin"

export async function POST(req) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("user:", user)

  if (authError || !user) {
    console.error("auth error:", authError)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { id, user_metadata } = user

  const playerInfo = {
    id,
    user_name: user_metadata?.user_name || "Anon",
    full_name: user_metadata?.full_name || "Anon",
    avatar_url: user_metadata?.avatar_url || "/default-pfp.png",
  }

  const { data, error } = await supabaseAdmin
    .from("game_rooms")
    .insert([
      {
        players: [playerInfo],
        host_id: id,
        status: "waiting",
      },
    ])
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }

  return NextResponse.json({ room: data }, { status: 200 })
}
