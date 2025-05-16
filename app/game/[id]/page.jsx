"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import Image from "next/image";

export default function GameRoomPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameRoom, setGameRoom] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inGame, setInGame] = useState(false);

  const getPlayerInfo = (userId) => {
    return gameRoom?.players.find((p) => p.id === userId);
  };

  useEffect(() => {
    if (gameRoom?.status === "running" || gameRoom?.status === "completed") {
      setInGame(true);
    }
  }, [gameRoom?.status]);

  useEffect(() => {
    const fetchUserAndGame = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        localStorage.setItem("pendingGameId", id);
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: roomData, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !roomData) {
        console.error("Error fetching room:", error);
        return;
      }

      const isUserInRoom = roomData.players?.some((p) => p.id === user.id);

      if (!isUserInRoom) {
        const res = await fetch("/api/join-game-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id }),
        });

        if (res.ok) {
          const { data: updatedRoom } = await supabase
            .from("game_rooms")
            .select("*")
            .eq("id", id)
            .single();
          setGameRoom(updatedRoom);
        } else {
          console.error("Join room failed");
        }
      } else {
        setGameRoom(roomData);
      }

      setLoading(false);
    };

    fetchUserAndGame();
  }, [id, router]);

  useEffect(() => {
    let channel = null;
    const subscribeToRoom = () => {
      channel = supabase
        .channel(`room-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "game_rooms",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            const updatedRoom = payload.new;
            setGameRoom(updatedRoom);
          }
        )
        .subscribe();
    };
    subscribeToRoom();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading || !user || !gameRoom) {
    return (
      <div className='flex items-center justify-center h-screen bg-gray-950 text-white'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white'></div>
      </div>
    );
  }

  const meIndex = gameRoom.game_state?.players
    ? gameRoom.game_state.players.findIndex((p) => p.user_id === user.id)
    : -1;

  const getRelativePlayers = () => {
    const players = gameRoom.game_state.players;
    return [...players.slice(meIndex), ...players.slice(0, meIndex)];
  };

  return (
    <div className='relative min-h-screen bg-gray-950 text-white overflow-hidden'>
      <Image
        src='/assets/background.png'
        alt='Background'
        fill
        className='absolute inset-0 object-cover opacity-30 z-0'
      />
      <div className='relative z-10 p-6'>
        {!inGame ? (
          <>
            <div className='flex justify-between items-start'>
              <Image
                src='/assets/logo.png'
                alt='Logo'
                width={160}
                height={80}
              />
              <div className='relative'>
                <Image
                  src={user?.user_metadata?.avatar_url || "/default-pfp.png"}
                  alt='Profile'
                  width={40}
                  height={40}
                  className='rounded-full cursor-pointer'
                  onClick={() => setShowLogout(!showLogout)}
                />
                {showLogout && (
                  <button
                    onClick={handleLogout}
                    className='absolute right-0 mt-2 bg-red-600 text-sm text-white px-3 py-1 rounded shadow-lg'>
                    Logout
                  </button>
                )}
              </div>
            </div>

            <div className='text-center mt-10'>
              <h1 className='text-4xl font-bold mb-2'>Game Room</h1>
              <p className='text-white mb-2'>
                {gameRoom.players.length} / 4 players joined
              </p>
              {gameRoom.players.length < 4 ? (
                <p className='text-yellow-400'>
                  Waiting for more players to join...
                </p>
              ) : (
                <p className='text-green-400'>Game is ready to start!</p>
              )}
            </div>

            <div className='mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto'>
              {gameRoom.players?.map((player, index) => {
                const colors = ["#da594b", "#539a97", "#f3bf56", "#538da3"];
                return (
                  <div
                    key={player.id}
                    className='p-4 rounded-3xl py-10 flex flex-col items-center border'
                    style={{
                      backgroundColor: colors[index % colors.length],
                      borderColor: "#282729",
                      borderWidth: "6px",
                    }}>
                    <img
                      src={player.avatar_url || "/default-pfp.png"}
                      alt='avatar'
                      className='w-16 h-16 rounded-full mb-2 border border-black/30'
                    />
                    <p className='font-semibold'>
                      {player.user_name || "Unnamed"}
                    </p>
                    {player.full_name && (
                      <p className='text-sm text-white/80'>
                        {player.full_name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className='mt-8 flex justify-center'>
              <button
                onClick={handleCopyLink}
                disabled={copied}
                className='inline-block disabled:opacity-60 group'>
                <Image
                  src='/assets/copy room link.png'
                  alt='Copy Link'
                  width={250}
                  height={80}
                  className='transition-all group-hover:scale-105 group-hover:-translate-y-1'
                />
              </button>
            </div>
          </>
        ) : (
          <div className='relative w-full h-[80vh] flex items-center justify-center'>
            {getRelativePlayers().map((player, pos) => {
              const playerInfo = getPlayerInfo(player.user_id);
              const globalIndex = (meIndex + pos) % 4;
              const isCurrentTurn =
                gameRoom.game_state.turn_index === globalIndex;
              const isMe = player.user_id === user.id;

              const layoutStyle =
                pos === 0
                  ? "absolute bottom-0 left-1/2 -translate-x-1/2"
                  : pos === 1
                  ? "absolute left-0 top-1/2 -translate-y-1/2"
                  : pos === 2
                  ? "absolute top-0 left-1/2 -translate-x-1/2"
                  : "absolute right-0 top-1/2 -translate-y-1/2";

              return (
                <div key={player.user_id} className={`${layoutStyle}`}>
                  <div
                    className={`p-1 rounded-2xl transition-all duration-300 ${
                      isCurrentTurn ? "ring-animation" : ""
                    }`}>
                    <div className='bg-[#0b1e2e]/80 p-4 rounded-xl shadow-md'>
                      <h2 className='text-md font-bold mb-2 text-white text-center'>
                        {playerInfo?.user_name || "Player"}
                      </h2>
                      <div
                        className={`flex ${
                          pos === 0 ? "flex-row" : "flex-wrap justify-center"
                        } gap-2`}>
                        {player.hand.map((card, i) => {
                          const handleCardClick = async () => {
                            if (!isCurrentTurn || !isMe) return;
                            const res = await fetch("/api/pass-card", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ roomId: id, card }),
                            });
                            const data = await res.json();
                            if (!res.ok) alert(data.error);
                          };

                          return (
                            <div
                              key={i}
                              onClick={handleCardClick}
                              className={`w-[10vh] h-[15vh] flex items-center justify-center overflow-hidden rounded-lg bg-black/60 ${
                                isCurrentTurn && isMe
                                  ? "cursor-pointer hover:border-yellow-400 border-2"
                                  : "opacity-60 border border-white/20"
                              }`}>
                              <Image
                                src={`/assets/${
                                  {
                                    1: "dog.webp",
                                    2: "cat.jpg",
                                    3: "bunny.jpg",
                                    4: "panda.jpg",
                                    0: "Null.png",
                                  }[card]
                                }`}
                                alt='card'
                                width={100}
                                height={160}
                                className='object-cover w-full h-full'
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
