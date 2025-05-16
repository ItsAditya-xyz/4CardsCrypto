"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

import LobbyView from "./component/LobbyView";
import GameView from "./component/GameView";

export default function GameRoomPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameRoom, setGameRoom] = useState(null);
  const [winnerId, setWinnerId] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [hasTriedJoining, setHasTriedJoining] = useState(false);

  const cardAssets = {
    0: "Null.png",
    1: "dog.webp",
    2: "cat.jpg",
    3: "bunny.jpg",
    4: "panda.jpg",
  };

  const getPlayerInfo = (userId) =>
    gameRoom?.players.find((p) => p.id === userId);

  const fetchAndSetGameRoom = async () => {
    const res = await fetch("/api/get-game-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: id }),
    });

    if (!res.ok) {
      console.error("Failed to fetch game room");
      return;
    }

    const { gameRoom } = await res.json();
    setGameRoom(gameRoom);

    const isUserInRoom = gameRoom.players?.some((p) => p.id === user?.id);
    if (!isUserInRoom && user && !hasTriedJoining) {
      setHasTriedJoining(true);
      const joinRes = await fetch("/api/join-game-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id }),
      });

      if (joinRes.ok) {
        await fetchAndSetGameRoom();
      } else {
        console.error("Join room failed");
      }
    }
  };

  // STEP 1: fetch user first
  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/user");
      const { user } = await res.json();

      if (!user) {
        localStorage.setItem("pendingGameId", id);
        router.push("/login");
        return;
      }

      setUser(user);
    };

    fetchUser();
  }, [id, router]);

  // STEP 2: fetch game room only after user is set
  useEffect(() => {
    if (!user) return;
    fetchAndSetGameRoom();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (gameRoom?.status === "running" || gameRoom?.status === "completed") {
      setInGame(true);
    }
  }, [gameRoom?.status]);

  useEffect(() => {
    let channel = null;

    const subscribe = async () => {
      const supabase = (await import("@/lib/supabaseClient")).default;

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
          async () => {
            await fetchAndSetGameRoom();
          }
        )
        .subscribe();
    };

    if (user) subscribe();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [id, user]);

  useEffect(() => {
    const fetchFinalCards = async () => {
      if (gameRoom?.status !== "completed") return;

      const res = await fetch("/api/get-all-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id }),
      });

      const { players, winner } = await res.json();

      setGameRoom((prev) => ({
        ...prev,
        game_state: {
          ...prev.game_state,
          players,
        },
      }));

      setWinnerId(winner);
    };

    fetchFinalCards();
  }, [gameRoom?.status, id]);

  const handleLogout = async () => {
    await fetch("/api/logout");
    router.push("/");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading || !user || !gameRoom) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
      </div>
    );
  }

  const meIndex = gameRoom.game_state?.players.findIndex(
    (p) => p.user_id === user.id
  );
  const getRelativePlayers = () => {
    const players = gameRoom.game_state.players;
    return [...players.slice(meIndex), ...players.slice(0, meIndex)];
  };

  return (
    <div className="relative min-h-screen bg-gray-950 text-white overflow-hidden">
      <Image
        src="/assets/background.png"
        alt="Background"
        fill
        className="absolute inset-0 object-cover opacity-70 z-0"
      />
      <div className="relative z-10 ">
        {!inGame ? (
          <LobbyView
            gameRoom={gameRoom}
            user={user}
            copied={copied}
            showLogout={showLogout}
            setShowLogout={setShowLogout}
            handleCopyLink={handleCopyLink}
            handleLogout={handleLogout}
          />
        ) : (
          <GameView
            gameRoom={gameRoom}
            user={user}
            cardAssets={cardAssets}
            meIndex={meIndex}
            getRelativePlayers={getRelativePlayers}
            getPlayerInfo={getPlayerInfo}
            id={id}
            winnerId={winnerId}
          />
        )}
      </div>
    </div>
  );
}
