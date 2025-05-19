// components/LobbyView.jsx
"use client";
import Image from "next/image";

export default function LobbyView({
  gameRoom,
  user,
  copied,
  showLogout,
  setShowLogout,
  handleCopyLink,
  handleLogout,
}) {
  console.log(user);
  return (
    <>
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

      <div className="text-center mt-10">
        <h1 className="text-4xl font-bold mb-2">Game Room</h1>
        <p className="text-white mb-2">{gameRoom.players.length} / 4 players joined</p>
        {gameRoom.players.length < 4 ? (
          <p className="text-yellow-400">Waiting for more players to join...</p>
        ) : (
          <p className="text-green-400">Game is ready to start!</p>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {gameRoom.players?.map((player, index) => {
          const colors = ["#da594b", "#539a97", "#f3bf56", "#538da3"];
          return (
            <div
              key={player.id}
              className="p-4 rounded-3xl py-10 flex flex-col items-center border"
              style={{
                backgroundColor: colors[index % colors.length],
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

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleCopyLink}
          disabled={copied}
          className="inline-block disabled:opacity-60 group"
        >
          <Image
            src="/assets/copy room link.png"
            alt="Copy Link"
            width={250}
            height={80}
            className="transition-all group-hover:scale-105 group-hover:-translate-y-1 hover:cursor-pointer"
          />
        </button>
      </div>
    </>
  );
}
