"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabaseClient"
import { useParams } from "next/navigation"
import Image from "next/image"

export default function GameRoomPage() {
  const router = useRouter()
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gameRoom, setGameRoom] = useState(null)

  useEffect(() => {
    const fetchUserAndGame = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUser(user)

      // Fetch game room data
      const { data: roomData, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error("Error fetching room:", error)
        return
      }

      // Check if user already in the game
      const isUserInRoom = roomData.players?.some((p) => p.id === user.id)

      // If not, join using API
      if (!isUserInRoom) {
        await fetch("/api/join-game-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id }),
        })
      }

      setGameRoom(roomData)
      setLoading(false)
    }

    fetchUserAndGame()
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Game Room</h1>
      <p className="text-gray-400 mb-6">Room ID: {id}</p>

      <div className="grid grid-cols-2 gap-4">
        {gameRoom.players?.map((player) => (
          <div
            key={player.id}
            className="bg-gray-800 p-4 rounded-lg flex items-center gap-4"
          >
            <img
              src={player.avatar_url || "/default-pfp.png"}
              alt="avatar"
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="font-semibold">{player.username || "Unnamed"}</p>
              <p className="text-sm text-gray-400">ID: {player.id}</p>
            </div>
          </div>
        ))}
      </div>

      {gameRoom.players.length < 4 ? (
        <p className="mt-6 text-yellow-400 text-lg">
          Waiting for more players to join...
        </p>
      ) : (
        <p className="mt-6 text-green-400 text-lg">Game is ready to start!</p>
      )}
    </div>
  )
}
