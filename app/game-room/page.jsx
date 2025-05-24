"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";
import emptyButton from "@/public/assets/emptyButton.png";

export default function GameRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/get-public-rooms?limit=20");
        const { rooms } = await res.json();
        setRooms(rooms);
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return (
    <div
      className='min-h-screen text-white relative flex flex-col items-center py-6 px-4'
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <Header showLogo />

      <h1 className='text-3xl font-bold text-center mb-6'>Join a Game Room</h1>

      {loading ? (
        <p className='text-lg text-gray-200 animate-pulse'>Loading rooms...</p>
      ) : rooms.length === 0 ? (
        <p className='text-lg text-yellow-200'>
          No public rooms available right now.
        </p>
      ) : (
        <div className='w-full max-w-2xl flex flex-col gap-4'>
          {rooms.map((room) => {
            const players = room.players || [];
            const host = players.find((p) => p.id === room.host_id);
            const slotsLeft = 4 - players.length;

            return (
              <div
                key={room.id}
                className='relative w-full rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-4 shadow-md flex flex-col gap-2'>
                {/* 🧑 Host info */}
                {host && (
                  <div className='flex items-center gap-3'>
                    <Image
                      src={host.avatar_url}
                      alt={host.user_name}
                      width={36}
                      height={36}
                      className='rounded-full border border-white shadow-md'
                    />
                    <p className='text-white font-medium text-sm'>
                      <span className='text-yellow-300'>@{host.user_name}</span>{" "}
                      is looking for players
                    </p>
                  </div>
                )}

                {/* 🧑‍🤝‍🧑 Joined players */}
                <div className='flex items-center gap-2 flex-wrap'>
                  {players.map((player) => (
                    <Image
                      key={player.id}
                      src={player.avatar_url}
                      alt={player.user_name}
                      width={32}
                      height={32}
                      className='rounded-full border border-white'
                      title={player.user_name}
                    />
                  ))}
                  {[...Array(slotsLeft)].map((_, i) => (
                    <div
                      key={i}
                      className='w-[32px] h-[32px] rounded-full bg-gray-700 border border-white/20 flex items-center justify-center text-sm text-gray-300'>
                      ?
                    </div>
                  ))}
                </div>

                {/* 🔢 Players needed */}
                <p className='text-sm text-gray-300 mt-1'>
                  {slotsLeft > 0
                    ? `Waiting for ${slotsLeft} more player${
                        slotsLeft > 1 ? "s" : ""
                      } to join`
                    : "Room is full"}
                </p>

                {/* 🔗 Join button */}
                <div className='self-center'>
                  <Link
                    href={`/game/${room.id}`}
                    className='relative w-[160px] h-[55px] hover:scale-105 transition-transform block'>
                    <Image
                      src={emptyButton}
                      alt='Join Game'
                      fill
                      className='object-contain pointer-events-none'
                    />
                    <span className='absolute inset-0 flex items-center justify-center font-bold text-black text-sm'>
                      Join Game
                    </span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
