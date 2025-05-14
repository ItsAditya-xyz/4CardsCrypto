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

  useEffect(() => {
    const fetchUserAndGame = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: roomData, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching room:", error);
        return;
      }

      const isUserInRoom = roomData.players?.some((p) => p.id === user.id);

      if (!isUserInRoom) {
        await fetch("/api/join-game-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: id }),
        });
      }

      setGameRoom(roomData);
      setLoading(false);
    };

    fetchUserAndGame();
  }, [id, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background image */}
      <Image
        src="/assets/background.png"
        alt="Background"
        fill
        className="absolute inset-0 object-cover opacity-30 z-0"
      />

      {/* Main content wrapper */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <Image src="/assets/logo.png" alt="Logo" width={160} height={80} />
          <div className="relative">
            <Image
              src={user?.user_metadata?.avatar_url || "/default-pfp.png"}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full cursor-pointer"
              onClick={() => setShowLogout(!showLogout)}
            />
            {showLogout && (
              <button
                onClick={handleLogout}
                className="absolute right-0 mt-2 bg-red-600 text-sm text-white px-3 py-1 rounded shadow-lg"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Room Info */}
        <div className="text-center mt-10">
          <h1 className="text-4xl font-bold mb-2">Game Room</h1>
        </div>

        {/* Player Cards */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {gameRoom.players?.map((player, index) => {
            const playerColors = [ "#da594b", "#539a97", "#f3bf56", "#538da3",];
            const bgColor = playerColors[index % playerColors.length];

            return (
              <div
                key={player.id}
                className="p-4 rounded-3xl py-10 flex flex-col items-center border"
                style={{
                  backgroundColor: bgColor,
                  borderColor: "#282729",
                  borderWidth: "6px",
                }}
              >
                <img
                  src={player.avatar_url || "/default-pfp.png"}
                  alt="avatar"
                  className="w-16 h-16 rounded-full mb-2 border border-black/30"
                />
                <p className="font-semibold">{player.user_name || "Unnamed"}</p>
                {player.full_name && (
                  <p className="text-sm text-white/80">{player.full_name}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className="mt-10 text-center text-lg">
          <p className="text-white mb-2">
            {gameRoom.players.length} / 4 players joined
          </p>
          {gameRoom.players.length < 4 ? (
            <p className="text-yellow-400">
              Waiting for more players to join...
            </p>
          ) : (
            <p className="text-green-400">Game is ready to start!</p>
          )}
        </div>

        {/* Copy Invite Link */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleCopyLink}
            disabled={copied}
            className="inline-block disabled:opacity-60 disabled:cursor-not-allowed group hover:cursor-pointer"
          >
            <Image
              src="/assets/copy room link.png"
              alt="Copy Link"
              width={250}
              height={80}
              className="transition-all duration-200 ease-in-out 
       group-hover:scale-105 group-hover:-translate-y-1 
       group-hover:opacity-90 group-active:scale-95"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
