"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/header";
import Link from "next/link";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: `${location.origin}/`,
      },
    });
  };

  const handleCreateGame = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-game-room", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create game");

      const data = await res.json();
      router.push(`/game/${data.room.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to create game room.");
    } finally {
      setLoading(false);
    }
  };

  const username = user?.user_metadata?.full_name || "Anon";
  const avatar = user?.user_metadata?.avatar_url || "/default-pfp.png";

  return (
    <div
      className=' w-full flex flex-col items-center justify-center text-white h-screen overflow-y-hidden gap-6'
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <Header />
      <Image
        src='/assets/logo.png'
        alt='Game Logo'
        width={500}
        height={400}
        className=''
      />

      {!user && (
        <p className='text-center text-green-100 max-w-md drop-shadow-md font-bold text-lg'>
          A 4-player strategic card game. Collect 4 of a kind, pass cards
          wisely, and outsmart your friends to win the crypto pot 💰
        </p>
      )}

      {user ? (
        <div className='flex flex-col items-center gap-2'>
          <button
            onClick={handleCreateGame}
            disabled={loading}
            className='mt-3 inline-block disabled:opacity-60 disabled:cursor-not-allowed group hover:cursor-pointer '>
            <Image
              src='/assets/createGameRoom2.png'
              alt='Create Game'
              width={200}
              height={80}
              className='transition-all duration-200 ease-in-out 
             group-hover:scale-105 group-hover:-translate-y-1 
             group-hover:opacity-90 group-active:scale-95'
            />
          </button>

          <Link
            href='/game/computer'
            className='mt-3 inline-block disabled:opacity-60 disabled:cursor-not-allowed group hover:cursor-pointer '>
            <Image
              src='/assets/playVSComputer.png'
              alt='Create Game'
              width={200}
              height={80}
              className='transition-all duration-200 ease-in-out 
             group-hover:scale-105 group-hover:-translate-y-1 
             group-hover:opacity-90 group-active:scale-95'
            />
          </Link>
        </div>
      ) : (
        <>
          <button onClick={handleLogin} className='mt-3 inline-block '>
            <Image
              src='/assets/loginwithtwitterFinal.png'
              alt='Log in with Twitter'
              width={300}
              height={80}
              className='transition-all duration-200 ease-in-out hover:scale-105 hover:-translate-y-1 hover:opacity-90 hover:cursor-pointer'
            />
          </button>
        </>
      )}
    </div>
  );
}
