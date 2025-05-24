// components/LobbyView.jsx
"use client";
import Header from "@/components/header";
import Image from "next/image";
import { Copy } from "lucide-react";
import emptyButton from "@/public/assets/emptyButton.png";
export default function LobbyView({ gameRoom, user, copied, handleCopyLink }) {
  console.log(user);
  return (
    <div className='h-screen overflow-y-hidden'>
      <div className='flex justify-between items-start '>
        <Header showLogo={true} />
      </div>

      <div className='text-center mt-24'>
        <h1 className='text-4xl font-bold mb-2'>Game Room</h1>
        <p className='text-white mb-2'>
          {gameRoom.players.length} / 4 players joined
        </p>
        {gameRoom.players.length < 4 ? (
          <p className='text-yellow-400'>Waiting for more players to join...</p>
        ) : (
          <p className='text-green-400'>Game is ready to start!</p>
        )}
      </div>

      <div className='mt-10 w-3/4 md:w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto'>
        {gameRoom.players?.map((player, index) => {
          const colors = ["#da594b", "#539a97", "#f3bf56", "#538da3"];
          return (
            <div
              key={player.id}
              className='p-4 rounded-3xl py-10 flex flex-col items-center border border-white/20 backdrop-blur-lg bg-white/10 shadow-md transition-transform hover:scale-105'>
              <img
                src={player.avatar_url || "/default-pfp.png"}
                alt='avatar'
                className='w-16 h-16 rounded-full mb-2 border border-black/30'
              />
              <p className='font-semibold'>{player.user_name || "Unnamed"}</p>
              {player.full_name && (
                <p className='text-sm text-white/80'>{player.full_name}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className='mt-4 sm:mt-8 flex justify-center'>
        <button
          onClick={handleCopyLink}
          disabled={copied}
          className='relative w-[250px] h-[70px] group disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform hover:cursor-pointer'>
          <Image
            src={emptyButton}
            alt='Copy Link'
            fill
            className='object-contain pointer-events-none'
          />
          <span className='absolute inset-0 flex items-center justify-center gap-2 font-bold text-black text-sm'>
            <Copy className='w-5 h-5' />
            {copied ? "Copied!" : "Copy Room Link"}
          </span>
        </button>
      </div>
    </div>
  );
}
