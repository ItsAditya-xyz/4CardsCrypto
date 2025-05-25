"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/header";
import Loader from "@/components/loader";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";
import emptyButton from "@/public/assets/emptyButton.png";

export default function UserProfilePage() {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerId, setViewerId] = useState(null);

  useEffect(() => {
    const fetchViewer = async () => {
      const { data } = await supabase.auth.getUser();
      setViewerId(data?.user?.id || null);
    };
    fetchViewer();
  }, []);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/get-user-by-name?username=${username}`);
        const data = await res.json();
        setUserData(data);

        if (data?.id) {
          const roomsRes = await fetch(
            `/api/get-rooms-by-player?user_id=${data.id}`
          );
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms || []);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const formatDateTime = (iso) =>
    new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getCardMeta = (id) => {
    const map = {
      1: { name: "Dog", points: 1000 },
      2: { name: "Cat", points: 800 },
      3: { name: "Bunny", points: 700 },
      4: { name: "Panda", points: 500 },
    };
    return map[id] || null;
  };

  const renderRoomAction = (room) => {
    if (room.status === "completed" || !viewerId) return null;
    const isViewerInRoom = room.players?.some((p) => p.id === viewerId);

    const label =
      room.status === "running" || isViewerInRoom
        ? "Continue Playing"
        : "Join Room";

    const icon = label === "Join Room" ? "➕" : "🎮";

    return (
      <Link
        href={`/game/${room.id}`}
        className='block w-[160px] h-[50px] relative group hover:scale-105 transition-transform hover:cursor-pointer'>
        <Image
          src={emptyButton}
          alt='room action'
          fill
          className='object-contain pointer-events-none'
        />
        <span className='absolute inset-0 flex items-center justify-center gap-1 font-bold text-black text-xs'>
          <span>{icon}</span>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className='min-h-screen relative text-white px-4 py-6 overflow-x-hidden'>
      <div className='absolute inset-0 z-0'>
        <Image
          src='/assets/background.png'
          alt='bg'
          fill
          className='object-cover pointer-events-none'
        />
      </div>

      <Header showLogo={true} showHamburger={true} />

      <main className='relative z-10 max-w-xl mx-auto mt-20'>
        {loading ? (
          <div className='flex items-center justify-center h-64'>
            <Loader />
          </div>
        ) : !userData ? (
          <p className='text-center text-red-400'>User not found.</p>
        ) : (
          <>
            <div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-md text-center space-y-4'>
              <a
                href={`https://x.com/${userData.user_name}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-block'>
                <div className='relative w-28 h-28 mx-auto'>
                  <Image
                    src={userData.avatar_url}
                    alt='avatar'
                    fill
                    className='rounded-full object-cover border-4 border-yellow-400 hover:opacity-90 transition'
                  />
                </div>
              </a>

              <a
                href={`https://x.com/${userData.user_name}`}
                target='_blank'
                rel='noopener noreferrer'
                className='block text-2xl font-bold text-yellow-300 hover:underline'>
                @{userData.user_name}
              </a>

              {userData.full_name && (
                <p className='text-white/80 text-sm'>{userData.full_name}</p>
              )}

              <div className='grid grid-cols-2 gap-4 text-sm text-white/80'>
                <div className='bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-3'>
                  <p className='text-xs text-gray-900 mb-1'>Points</p>
                  <p className='text-lg text-yellow-400 font-bold'>
                    {userData.points}
                  </p>
                </div>

                <div className='bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-3'>
                  <p className='text-xs text-gray-900 mb-1'>Games Won</p>
                  <p className='text-lg text-green-400 font-bold'>
                    {userData.games_won}
                  </p>
                </div>

                <div className='bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-3 col-span-2'>
                  <p className='text-xs text-gray-900 mb-1'>Joined</p>
                  <p className='text-sm'>
                    {formatDateTime(userData.created_at)}
                  </p>
                </div>

                <div className='bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-3 col-span-2'>
                  <p className='text-xs text-gray-900 mb-1'>Last Login</p>
                  <p className='text-sm'>
                    {formatDateTime(userData.last_login)}
                  </p>
                </div>
              </div>
            </div>

            {/* Game Rooms List */}
            {rooms.length > 0 && (
              <div className='mt-10 space-y-4'>
                <h2 className='text-xl font-semibold text-yellow-300 mb-4'>
                  Recent Matches
                </h2>
                {rooms.map((room) => {
                  const isWinner = room.winner_id === userData.id;
                  const cardMeta = getCardMeta(room.card_collected);

                  return (
                    <div
                      key={room.id}
                      className='bg-white/10 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-sm text-sm text-white/90 space-y-2'>
                      <div className='flex justify-between items-center'>
                        <p className='font-medium capitalize'>
                          {room.status === "running"
                            ? "In Progress"
                            : room.status === "waiting"
                            ? "Waiting for players"
                            : "Game Completed"}
                        </p>
                        {renderRoomAction(room)}
                      </div>

                      {/* Players */}
                      <div className='flex items-center gap-2 mt-1 flex-wrap'>
                        {room.players?.map((p) => (
                          <Link
                            key={p.id}
                            href={`/u/${p.user_name}`}
                            className='hover:scale-105 transition-transform'>
                            <Image
                              src={p.avatar_url || "/default-pfp.png"}
                              alt={`@${p.user_name}`}
                              width={30}
                              height={30}
                              className='rounded-full border border-white/20'
                              title={`@${p.user_name}`}
                            />
                          </Link>
                        ))}
                      </div>

                   {room.winner_id && cardMeta && (() => {
  const winner = room.players?.find(p => p.id === room.winner_id);
  if (!winner) return null;
  return (
    <div className='flex items-center gap-2 text-xs text-yellow-200 mt-2'>
      <Link href={`/u/${winner.user_name}`} className='flex items-center gap-1'>
        <Image
          src={winner.avatar_url || "/default-pfp.png"}
          alt='Winner Avatar'
          width={24}
          height={24}
          className='rounded-full border border-yellow-300'
        />
        <span className='font-semibold text-white'>@{winner.user_name}</span>
      </Link>
      <span>won the game and collected</span>
      <Image
        src={`/assets/${cardMeta.name.toLowerCase()}.jpg`}
        alt={cardMeta.name}
        width={24}
        height={32}
        className='rounded-md border border-yellow-300'
      />
      <span className='font-semibold'>{cardMeta.name}</span>
      <span className='text-white/70'>+{cardMeta.points} pts</span>
    </div>
  );
})()}

                      <p className='text-xs text-gray-300'>
                        Played on: {formatDateTime(room.created_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
