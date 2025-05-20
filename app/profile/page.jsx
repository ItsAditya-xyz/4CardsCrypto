"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/header";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push("/");
        return;
      }
      setUser(data.user);
    };
    fetchUser();
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-900">
        Loading...
      </div>
    );
  }

  const { avatar_url, user_name, full_name } = user.user_metadata;

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white"
      style={{ backgroundImage: "url(/assets/background.png)" }}
    >
      <Header showLogo={true} showHamburger={true} />

      <div className="flex flex-col items-center justify-center pt-32 px-6 text-center">
        <Image
          src={avatar_url || "/assets/default-avatar.png"}
          alt="Avatar"
          width={100}
          height={100}
          className="rounded-full border-4 border-yellow-400"
        />
        <h1 className="text-2xl font-bold mt-4">@{user_name || "player"}</h1>
        {full_name && (
          <p className="text-white/80 mt-1 text-sm">Name: {full_name}</p>
        )}

        <div className="bg-black/40 border border-yellow-400 rounded-xl mt-8 p-6 w-full max-w-sm space-y-4">
          <p className="font-semibold">🎮 Games Played: 42</p>
          <p className="font-semibold">🏆 Wins: 12</p>
          <p className="font-semibold">🧠 Strategy Score: 88</p>
        </div>
      </div>
    </div>
  );
}
