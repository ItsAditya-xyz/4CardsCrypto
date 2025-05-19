"use client";

import { useEffect, useState } from "react";
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
  playerStates,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMyTurn =
    gameRoom.game_state?.turn_index === meIndex &&
    gameRoom.status === "running";

  const renderCard = (
    card,
    index,
    isCurrentTurn,
    isClickable,
    isWinner = false
  ) => {
    const handleCardClick = async () => {
      if (!isClickable || card === null) return;

      const res = await fetch("/api/pass-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: id, card }),
      });

      const data = await res.json();
      if (!res.ok) alert(data.error || "Failed to pass card.");
    };

    return (
      <div
        key={index}
        onClick={handleCardClick}
        className={`rounded-md overflow-hidden border-2 bg-black/60 transition-all duration-200 w-[80px] h-[110px] md:w-[100px] md:h-[140px] ${
          isClickable
            ? "hover:scale-105 cursor-pointer border-yellow-400"
            : !isWinner
            ? "opacity-50 border-white/20"
            : null
        } ${isWinner ? "scale-105 border-yellow-400" : ""}`}>
        {card !== null ? (
          <Image
            src={`/assets/${cardAssets[String(card)]}`}
            alt='card'
            width={100}
            height={140}
            className='w-full h-full object-cover'
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
  };

  if (isMobile) {
    const all = getRelativePlayers();
    const clockwiseOrder = [all[2], all[3], all[1], all[0]];

    return (
      <div className='w-full min-h-[100vh] grid grid-cols-2 justify-items-center'>
        {clockwiseOrder.map((player, pos) => {
          const globalIndex = gameRoom.players.findIndex(
            (p) => p.id === player.user_id
          );
          const isCurrentTurn = gameRoom.game_state?.turn_index === globalIndex;
          const isMe = player.user_id === user.id;
          const playerInfo = getPlayerInfo(player.user_id);
          let cards;

          const isLastReceiver =
            gameRoom.players[gameRoom.game_state?.last_receiver_index]?.id ===
            player.user_id;

          if (gameRoom.status === "completed" || isMe) {
            cards = player.hand;
          } else if (isLastReceiver) {
            // Show one revealed card for the last receiver
            let injected = false;
            cards = player.hand.map(() => {
              if (!injected) {
                injected = true;
                return gameRoom.game_state?.last_passed_card;
              }
              return null;
            });
          } else {
            // Hide everything for others
            cards = player.hand.map(() => null);
          }

          return (
            <div
              key={player.user_id}
              className='w-full bg-[#0b1e2e]/80 p-3 shadow-md flex flex-col items-center relative transition-transform duration-300'>
              <div className='flex flex-col items-center mb-2'>
                <Image
                  src={playerInfo?.avatar_url || "/default-pfp.png"}
                  alt='avatar'
                  width={40}
                  height={40}
                  className='rounded-full border border-white/30'
                />
                <p className='text-sm text-white mt-1 truncate text-center max-w-[100px]'>
                  @{playerInfo?.user_name || "player"}
                </p>
                {winnerId === player.user_id && (
                  <p className='text-xs text-yellow-400 font-bold animate-bounce mt-1'>
                    🏆 Winner!
                  </p>
                )}
              </div>
              <div className='grid grid-cols-2 gap-2'>
                {cards.map((card, i) =>
                  renderCard(card, i, isCurrentTurn, isMe && isMyTurn, winnerId === player.user_id)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className='relative w-full h-[90vh] flex items-center justify-center mt-10'>
      {getRelativePlayers().map((player, pos) => {
        const globalIndex = gameRoom.players.findIndex(
          (p) => p.id === player.user_id
        );
        const isCurrentTurn = gameRoom.game_state?.turn_index === globalIndex;
        const isMe = player.user_id === user.id;
        const playerInfo = getPlayerInfo(player.user_id);
        // const actualHand =
        //   playerStates.find((p) => p.user_id === player.user_id)?.hand || [];
        let cards;

        const isLastReceiver =
          gameRoom.players[gameRoom.game_state?.last_receiver_index]?.id ===
          player.user_id;

        if (gameRoom.status === "completed" || isMe) {
          cards = player.hand;
        } else if (isLastReceiver) {
          // Show one revealed card for the last receiver
          let injected = false;
          cards = player.hand.map(() => {
            if (!injected) {
              injected = true;
              return gameRoom.game_state?.last_passed_card;
            }
            return null;
          });
        } else {
          // Hide everything for others
          cards = player.hand.map(() => null);
        }

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
              className={`rounded-2xl transition-all duration-300 ${
                isCurrentTurn ? "ring-animation" : ""
              }`}>
              <div
                className={`bg-[#0b1e2e]/80 p-4 rounded-xl shadow-md transition-all duration-300 ${
                  winnerId === player.user_id
                    ? "ring-2 ring-yellow-400 shadow-yellow-300"
                    : ""
                }`}>
                {gameRoom?.game_state?.last_passed_card &&
                  player.user_id ===
                    gameRoom.players[gameRoom.game_state?.last_receiver_index]
                      ?.id && (
                    <div className='mb-2 text-yellow-300 text-sm text-center animate-ping-slow'></div>
                  )}

                <h2 className='text-md font-bold text-white text-center'>
                  {playerInfo?.user_name || "Player"}
                </h2>
                {winnerId === player.user_id && (
                  <p className='text-xs text-yellow-400 font-bold animate-bounce text-center mt-1'>
                    🏆 Winner!
                  </p>
                )}

                <div
                  className={`flex ${
                    pos === 0 ? "flex-row" : "flex-wrap justify-center"
                  } gap-2`}>
                  {cards.map((card, i) =>
                    renderCard(
                      card,
                      i,
                      isCurrentTurn,
                      isMe && isMyTurn,
                      winnerId === player.user_id // new param: isWinner
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
