"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/header";

const cards = [
  
  {
    id: 4,
    name: "Bunny",
    points: 700,
    image: "/assets/bunny.jpg",
    url: "https://opensea.io/item/avalanche/0x68f2930b3db49204797209d891ad965c93a57157/4",
  },
  {
    id: 3,
    name: "Doggo",
    points: 1000,
    image: "/assets/dog.webp",
    url: "https://opensea.io/item/avalanche/0x68f2930b3db49204797209d891ad965c93a57157/3",
  },
  {
    id: 2,
    name: "Cat",
    points: 800,
    image: "/assets/cat.jpg",
    url: "https://opensea.io/item/avalanche/0x68f2930b3db49204797209d891ad965c93a57157/2",
  },
  {
    id: 1,
    name: "Panda",
    points: 500,
    image: "/assets/panda.jpg",
    url: "https://opensea.io/item/avalanche/0x68f2930b3db49204797209d891ad965c93a57157/1",
  },
  {
    id: 5,
    name: "Wolf",
    points: 0,
    image: "/assets/Null.png",
    url: "https://opensea.io/item/avalanche/0x68f2930b3db49204797209d891ad965c93a57157/5",
  },
];

export default function CardNFTPage() {
  return (
    <div className="min-h-screen text-white px-4 py-6 relative overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/background.png"
          alt="background"
          fill
          className="object-cover pointer-events-none"
        />
      </div>

      <Header showLogo={true} showHamburger={true} />

      <main className="relative z-10 max-w-6xl mx-auto mt-20">
        <h1 className="text-3xl font-bold text-yellow-300 text-center mb-10">
          🎴 Official Game Cards on OpenSea
        </h1>

        <div className="flex flex-wrap justify-center gap-4">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-2/3 sm:w-[260px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-md hover:scale-105 hover:bg-white/20 transition-transform text-center"
            >
              <div className="relative w-full h-[300px] mb-4">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="rounded-lg object-cover border border-yellow-400"
                />
              </div>
              <h2 className="text-lg font-bold text-yellow-300 mb-1">{card.name}</h2>
              {card.points > 0 ? (
                <p className="text-sm text-white/70">Worth: +{card.points} pts</p>
              ) : (
                <p className="text-sm text-red-400">Penalty Card</p>
              )}
              <p className="text-xs text-white/40 mt-2">View on OpenSea ↗</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
