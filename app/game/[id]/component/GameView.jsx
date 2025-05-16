"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function GameView({
  gameRoom,
  user,
  cardAssets,
  meIndex,
  getRelativePlayers,
  getPlayerInfo,
  id,
  winnerId,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <div className="w-full min-h-[100vh] grid grid-cols-2 justify-items-center">
        {getRelativePlayers().map((player, pos) => {
          const playerInfo = getPlayerInfo(player.user_id);
          const isCurrentTurn =
            gameRoom.game_state.turn_index === (meIndex + pos) % 4;
          const isMe = player.user_id === user.id;
  
          return (
            <div
              key={player.user_id}
              className="w-full bg-[#0b1e2e]/80 p-3 shadow-md flex flex-col items-center relative transition-transform duration-300"
            >
              <div className="flex flex-col items-center mb-2">
                <Image
                  src={playerInfo?.avatar_url || "/default-pfp.png"}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full border border-white/30"
                />
                <p className="text-sm text-white mt-1 truncate text-center max-w-[100px]">
                  @{playerInfo?.user_name || "player"}
                </p>
                {winnerId === player.user_id && (
                  <p className="text-xs text-yellow-400 font-bold animate-bounce mt-1">
                    🏆 Winner!
                  </p>
                )}
              </div>
  
              <div className="grid grid-cols-2 gap-2">
                {(gameRoom.status === "completed" || isMe
                  ? player.hand
                  : Array(player.hand.length).fill(null)
                ).map((card, cardIdx) => {
                  const isMyTurn =
                    isMe &&
                    gameRoom.game_state.turn_index === meIndex &&
                    gameRoom.status === "running";
  
                  const handleCardClick = async () => {
                    if (!isMyTurn || card === null) return;
  
                    const res = await fetch("/api/pass-card", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ roomId: id, card }),
                    });
  
                    const data = await res.json();
                    if (!res.ok) {
                      alert(data.error || "Failed to pass card.");
                    }
                  };
  
                  return (
                    <div
                      key={cardIdx}
                      onClick={handleCardClick}
                      className={`rounded-md overflow-hidden border-2 bg-black/60 transition-all duration-200 w-[80px] h-[110px] md:w-[100px] md:h-[140px] ${
                        isMyTurn
                          ? "hover:scale-105 cursor-pointer border-yellow-400"
                          : "opacity-50 border-white/20"
                      }`}
                    >
                      {card !== null ? (
                        <Image
                          src={`/assets/${cardAssets[String(card)]}`}
                          alt="card"
                          width={100}
                          height={140}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gray-800 relative overflow-hidden rounded-md ${
                            isCurrentTurn ? "shimmer" : ""
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  

  // 👇 Desktop layout continues as-is
  return (
    <div className="relative w-full h-[90vh] flex items-center justify-center mt-10">
      {getRelativePlayers().map((player, pos) => {
        const playerInfo = getPlayerInfo(player.user_id);
        const globalIndex = (meIndex + pos) % 4;
        const isCurrentTurn = gameRoom.game_state.turn_index === globalIndex;
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
              className={` rounded-2xl transition-all duration-300 ${
                isCurrentTurn ? "ring-animation" : ""
              }`}
            >
              <div className="bg-[#0b1e2e]/80 p-4 rounded-xl shadow-md">
                {gameRoom?.game_state?.last_passed_card &&
                  player.user_id ===
                    gameRoom?.game_state?.players?.[
                      gameRoom.game_state.last_receiver_index
                    ]?.user_id && (
                    <div className="mb-2 text-yellow-300 text-sm text-center animate-ping-slow">
                      Received:{" "}
                      {
                        cardAssets[gameRoom.game_state.last_passed_card]
                          ?.split(".")[0]
                      }
                    </div>
                  )}

                <h2 className="text-md font-bold mb-2 text-white text-center">
                  {playerInfo?.user_name || "Player"}
                </h2>
                <div
                  className={`flex ${
                    pos === 0 ? "flex-row" : "flex-wrap justify-center"
                  } gap-2`}
                >
                  {gameRoom.status === "completed" || isMe
                    ? player.hand.map((card, i) => {
                        const isMyTurn =
                          isMe &&
                          gameRoom.game_state.turn_index === meIndex &&
                          gameRoom.status === "running";

                        const handleCardClick = async () => {
                          if (!isMyTurn) return;

                          const res = await fetch("/api/pass-card", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ roomId: id, card }),
                          });

                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error || "Failed to pass card.");
                          }
                        };

                        return (
                          <div
                            key={i}
                            onClick={handleCardClick}
                            className={`w-[10vh] h-[15vh] flex items-center justify-center overflow-hidden rounded-lg border border-white/20 transition-all duration-150 ${
                              isMyTurn
                                ? "cursor-pointer hover:scale-105 bg-black/60"
                                : "bg-black/60 opacity-70"
                            }`}
                          >
                            <Image
                              src={`/assets/${cardAssets[String(card)]}`}
                              alt="card"
                              width={100}
                              height={160}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        );
                      })
                    : player.hand.map((_, i) => (
                        <div
                          key={i}
                          className="w-[10vh] h-[15vh] rounded-lg bg-gray-800 border border-white/20 opacity-30"
                        />
                      ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
