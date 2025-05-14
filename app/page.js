"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import supabase from "@/lib/supabaseClient"
import { FaTwitter } from "react-icons/fa"

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${location.origin}/`, // 👈 redirects back to home
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleCreateGame = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/create-game-room", {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to create game")

      const data = await res.json()
      router.push(`/game/${data.room.id}`)
    } catch (err) {
      console.error(err)
      alert("Failed to create game room.")
    } finally {
      setLoading(false)
    }
  }

  const username = user?.user_metadata?.full_name || "Anon"
  const avatar = user?.user_metadata?.avatar_url || "/default-pfp.png"

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-8">
      <Image src="/logo.png" alt="Game Logo" width={100} height={100} />

      <h1 className="text-4xl font-bold mt-4">4 Cards Crypto Game</h1>
      <p className="text-gray-400 text-center max-w-md mt-2">
        A fun 4-player strategic card game where the winner takes the crypto pot.
        Collect 4 of a kind, pass wisely, and outsmart your friends.
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-4 mt-6">
          <div className="flex items-center gap-3">
            <img
              src={avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full border border-gray-700"
            />
            <p className="text-xl font-semibold">GM, {username} 👋</p>
          </div>

          <button
            onClick={handleCreateGame}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full transition disabled:opacity-50"
          >
            {loading ? "Creating Game..." : "Create Game Room"}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="mt-6 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full transition"
        >
          <FaTwitter size={20} />
          Login with Twitter
        </button>
      )}
    </div>
  )
}
