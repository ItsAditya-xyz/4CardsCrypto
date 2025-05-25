"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Header from "@/components/header";
import Link from "next/link";
import Loader from "@/components/loader";
import emptyButton from "@/public/assets/emptyButton.png";
import { Plus, Eye, Bot, Trophy, BadgeCheck } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [creatatingGameRoom, setCreatingGameRoom] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoadingUser(false);
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
    setLoadingUser(true);
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
      setLoadingUser(false);
    } finally {
      // setLoadingUser(false);
    }
  };

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
        src='/assets/bannerImage.png'
        alt='Game Logo'
        width={500}
        height={400}
        className={loadingUser ? "mb-24": ""}
      />

      {loadingUser && <Loader />}

      {!loadingUser && (
        <>
          {!user && (
            <p className='text-center text-green-100 max-w-md drop-shadow-md font-bold text-lg'>
              A 4-player strategic card game. Collect 4 of a kind, pass cards
              wisely, and outsmart your friends to win the crypto pot 💰
            </p>
          )}

          {user ? (
            <div className='flex flex-col items-center'>
              {/* ➕ Create Game Room */}
              <button
                onClick={handleCreateGame}
                disabled={loading}
                className='relative w-[240px] h-[80px] group disabled:opacity-60 disabled:cursor-not-allowed hover:cursor-pointer transition-transform hover:scale-105'>
                <Image
                  src={emptyButton}
                  alt='Create Game'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-lg'>
                  <Plus className='w-5 h-5' />
                  Create Game Room
                </span>
              </button>

              {/* 👁️ See Rooms */}
              <Link
                href='/game-room'
                className='relative w-[240px] h-[80px] group hover:cursor-pointer transition-transform hover:scale-105'>
                <Image
                  src={emptyButton}
                  alt='See Rooms'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-lg'>
                  <Eye className='w-5 h-5' />
                  See Rooms
                </span>
              </Link>

              {/* 🤖 Play vs Computer */}
              <Link
                href='/game/computer'
                className='relative w-[240px] h-[80px] group hover:cursor-pointer transition-transform hover:scale-105'>
                <Image
                  src={emptyButton}
                  alt='Play vs Computer'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-lg'>
                  <Bot className='w-5 h-5' />
                  Play vs Computer
                </span>
              </Link>

              {/* 🏆 Leaderboard */}
              <Link
                href='/leaderboard'
                className='relative w-[240px] h-[80px] group hover:cursor-pointer transition-transform hover:scale-105'>
                <Image
                  src={emptyButton}
                  alt='Leaderboard'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-lg'>
                  <Trophy className='w-5 h-5' />
                  Leaderboard
                </span>
              </Link>

              {/* 🃏 Card NFT */}
              <Link
                href='/card-nft'
                className='relative w-[240px] h-[80px] group hover:cursor-pointer transition-transform hover:scale-105'>
                <Image
                  src={emptyButton}
                  alt='Card NFT'
                  fill
                  className='object-contain pointer-events-none'
                />
                <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-lg'>
                  <BadgeCheck className='w-5 h-5' />
                  Card NFT
                </span>
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
        </>
      )}
    </div>
  );
}
