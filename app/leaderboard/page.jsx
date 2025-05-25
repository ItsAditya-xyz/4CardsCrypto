"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import Loader from "@/components/loader";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/get-leaderboards?limit=100&page=1");
        const data = await res.json();
        setPlayers(data.leaderboard || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className='min-h-screen  text-white px-4 py-6 relative overflow-x-hidden'>
      {/* Background */}
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/background.png'
          alt='background'
          fill
          className='object-cover pointer-events-none'
        />
      </div>

      <Header showLogo={true} showHamburger={true} />

      <main className='relative z-10 max-w-3xl mx-auto mt-20'>
        <h1 className='text-3xl font-bold text-center mb-8 text-yellow-400'>
          🏆 Top Players
        </h1>

        {loading ? (
            <div className="mt-20">
        <Loader/>
        </div>
        ) : (
          <ul className='space-y-4'>
            {players.map((player, index) => (
              <li key={player.id}>
                <Link
                  href={`/u/${player.user_name}`}
                  className='flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-md hover:scale-[1.015] hover:bg-white/20 transition-transform cursor-pointer'

                >
                  <div className='relative w-14 h-14 shrink-0'>
                    <Image
                      src={player.avatar_url}
                      alt='avatar'
                      fill
                      className='rounded-full object-cover border border-white/30'
                    />
                  </div>

                  <div className='flex-1'>
                    <p className='text-lg font-semibold text-yellow-300'>
                      #{index + 1} {player.user_name}
                    </p>
                    <p className='text-sm text-white/80'>{player.full_name}</p>
                    <p className='text-xs text-gray-400'>
                      Joined: {formatDate(player.created_at)}
                    </p>
                  </div>

                  <div className='ml-auto text-yellow-400 font-bold text-lg'>
                    {player.points} pts
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
