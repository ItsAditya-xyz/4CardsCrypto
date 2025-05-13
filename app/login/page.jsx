"use client"

import { useEffect, useState } from "react"
import supabase from "@/lib/supabaseClient"

export default function LoginComponent() {
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

  if (user) {
    const username = user.user_metadata.full_name || "Anon"
    const avatar = user.user_metadata.avatar_url || "/default-pfp.png"

    return (
      <div className="text-white flex items-center gap-4 p-4">
        <img src={avatar} alt="pfp" className="w-10 h-10 rounded-full" />
        <p className="text-lg font-semibold">GM, {username} 👋</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Login with Twitter
      </button>
    </div>
  )
}
