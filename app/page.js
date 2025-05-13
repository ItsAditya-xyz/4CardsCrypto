"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import supabase from "@/lib/supabaseClient"
import { FaTwitter } from "react-icons/fa"

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
    }

    getUser()
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: "twitter" })
  }

  const username = user?.user_metadata?.full_name
  const avatar = user?.user_metadata?.avatar_url

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-8">
      <Image src="/logo.png" alt="Game Logo" width={100} height={100} />

      <h1 className="text-4xl font-bold mt-4">4 Cards Crypto Game</h1>
      <p className="text-gray-400 text-center max-w-md mt-2">
        A fun 4-player strategic card game where the winner takes the crypto pot.
        Collect 4 of a kind, pass wisely, and outsmart your friends.
      </p>

      {user ? (
        <div className="flex flex-col items-center gap-3 mt-6">
          <img
            src={avatar}
            alt="avatar"
            className="w-12 h-12 rounded-full border border-gray-700"
          />
          <p className="text-xl">GM, {username} 👋</p>
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
