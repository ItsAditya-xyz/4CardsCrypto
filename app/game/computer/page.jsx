"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { distributeCards } from "@/lib/distributeCards";
import Toast from "@/components/toast";
import Header from "@/components/header";
const cardTypes = [
  { id: 1, name: "Dog", image: "/assets/dog.webp", points: 1000 },
  { id: 2, name: "Cat", image: "/assets/cat.jpg", points: 850 },
  { id: 3, name: "Bunny", image: "/assets/bunny.jpg", points: 700 },
  { id: 4, name: "Panda", image: "/assets/panda.jpg", points: 500 },
  { id: 0, name: "Null", image: "/assets/Null.png", points: 0 },
];

const generateCardImage = (id) =>
  cardTypes.find((c) => c.id === parseInt(id)) || cardTypes[4];

export default function GameVsComputer() {
  const createInitialPlayers = () => {
    const players = [
      { id: "p1", name: "Player A" },
      { id: "p2", name: "Bot B" },
      { id: "p3", name: "Bot C" },
      { id: "p4", name: "Bot D" },
    ];

    const { playerStates, turnIndex } = distributeCards(players);
    const fullPlayers = players.map((p, index) => ({
      ...p,
      hand: playerStates[index].hand,
    }));

    return { fullPlayers, startingTurn: turnIndex };
  };

  const init = createInitialPlayers();
  const [players, setPlayers] = useState(init.fullPlayers);
  const [currentTurn, setCurrentTurn] = useState(init.startingTurn);
  const [lastPassedCard, setLastPassedCard] = useState(null);
  const [lastReceiver, setLastReceiver] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const lastPassedRef = useRef(null);
  const justPassedRef = useRef(false);

  const playSound = (src) => {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2000);
  };

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  useEffect(() => {
    if (winner !== null || currentTurn === 0) return;
    const timeout = setTimeout(() => {
      const bot = players[currentTurn];
      const validCardIndex = getSmartBotCardIndex(bot, currentTurn);
      if (validCardIndex !== -1) {
        passCard(currentTurn, validCardIndex);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [currentTurn]);

  useEffect(() => {
    if (lastPassedCard && lastPassedCard !== lastPassedRef.current) {
      if (justPassedRef.current) {
        playSound("/sounds/card-place-2.ogg");
        justPassedRef.current = false;
      } else {
        playSound("/sounds/card-place-2.ogg");
      }
    }
    lastPassedRef.current = lastPassedCard;
  }, [lastPassedCard]);

  useEffect(() => {
    if (winner === null) return;
    const isPlayerAWinner = players.find((p) => p.name === winner).id === "p1";
    playSound(
      isPlayerAWinner ? "/sounds/winSound.ogg" : "/sounds/loseSound.ogg"
    );
  }, [winner]);

  const getSmartBotCardIndex = (botPlayer, botIndex) => {
    const handCounts = botPlayer.hand.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const sortedByLeast = Object.entries(handCounts)
      .sort((a, b) => a[1] - b[1])
      .map(([card]) => card);

    for (const card of sortedByLeast) {
      const cardIndex = botPlayer.hand.indexOf(card);
      if (cardIndex === -1) continue;

      const isFirstTurn = botIndex === 0 && lastPassedCard === null;
      if (isFirstTurn && card === "0") continue;

      const isPassingBackSameCard =
        lastReceiver === botIndex && card === lastPassedCard;

      if (isPassingBackSameCard && handCounts[card] < 2) continue;

      return cardIndex;
    }

    return -1;
  };

  const passCard = (playerIndex, cardIndex) => {
    if (winner !== null) return;

    const currentPlayer = players[playerIndex];
    const nextPlayerIndex = (playerIndex + 1) % 4;
    const card = currentPlayer.hand[cardIndex];
    const isFirstTurn = playerIndex === 0 && lastPassedCard === null;

    if (isFirstTurn && card === "0") {
      showToast("❌ You can't pass the null card on the first move.");
      return;
    }

    const isPassingBackSameCard =
      lastReceiver === playerIndex && card === lastPassedCard;
    if (isPassingBackSameCard) {
      const count = currentPlayer.hand.filter((c) => c === card).length;
      if (count < 2) {
        showToast(
          "❌ You can't pass back the card just received unless you have more than one."
        );
        return;
      }
    }

    const newPlayers = [...players];
    newPlayers[playerIndex].hand.splice(cardIndex, 1);
    newPlayers[nextPlayerIndex].hand.push(card);

    const counts = newPlayers[nextPlayerIndex].hand.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

    const hasWon = Object.values(counts).some((count) => count === 4);

    setPlayers(newPlayers);
    setLastPassedCard(card);
    setLastReceiver(nextPlayerIndex);
    setCurrentTurn(nextPlayerIndex);
    justPassedRef.current = true;

    if (hasWon) {
      setWinner(newPlayers[nextPlayerIndex].name);
    }
  };

  const isGameOver = winner !== null;

  // 🟩 Mobile layout
  if (isMobile) {
    const order = [2, 3, 1, 0]; // Bot C, Bot D, Bot B, Player A
    return (
      <div className="bg-[#0b1e2e]">
        <Header showHamburger={true} />
        <div className="w-full h-screen overflow-y-hidden grid grid-cols-2 justify-items-center pt-12">
          {toastMsg && <Toast message={toastMsg} />}

          {order.map((index) => {
            const player = players[index];
            const isCurrent = index === currentTurn;
            const isPlayerA = index === 0;
            const isLastReceiver = index === lastReceiver;
            const cards =
              isGameOver || isPlayerA
                ? player.hand
                : isLastReceiver
                ? player.hand.map((card, i) =>
                    i === 0 ? lastPassedCard : null
                  )
                : player.hand.map(() => null);

            return (
              <div
                key={index}
                className={`bg-[#0b1e2e]/80 transition-all duration-300 w-full flex flex-col items-center ${
                  isCurrent ? "ring-animation" : ""
                } ${
                  winner === player.name
                    ? "ring-2 ring-yellow-400 shadow-yellow-300"
                    : ""
                }`}
              >
                <p className="text-sm font-bold text-center mb-2">
                  {player.name}
                  {winner === player.name && (
                    <span className="text-yellow-400 ml-2 animate-bounce">
                      🏆
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {cards.map((card, cardIdx) => {
                    const cardInfo = generateCardImage(card);
                    return (
                      <div
                        key={cardIdx}
                        className={`w-[80px] h-[110px] border-2 rounded-md overflow-hidden transition-all duration-200 ${
                          index === 0 && isCurrent
                            ? "hover:border-yellow-400 cursor-pointer"
                            : "opacity-60 border-transparent"
                        }`}
                        onClick={() =>
                          index === 0 && isCurrent && passCard(index, cardIdx)
                        }
                      >
                        {card !== null ? (
                          <Image
                            src={cardInfo.image}
                            alt={cardInfo.name}
                            width={80}
                            height={110}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gray-800 ${
                              isCurrent ? "shimmer2" : ""
                            }`}
                          ></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 💻 Desktop layout
  const renderOrder = [0, 1, 2, 3];

  return (
    <div
      className="min-h-screen text-white flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
         <Header showHamburger={true} />
      {toastMsg && <Toast message={toastMsg} />}

      <div className="relative w-[90vw] h-[80vh] rounded-xl overflow-hidden">
        {renderOrder.map((index) => {
          const player = players[index];
          const pos = index;
          const layoutStyle =
            pos === 0
              ? "absolute bottom-0 left-1/2 -translate-x-1/2"
              : pos === 1
              ? "absolute left-0 top-1/2 -translate-y-1/2"
              : pos === 2
              ? "absolute top-0 left-1/2 -translate-x-1/2"
              : "absolute right-0 top-1/2 -translate-y-1/2";

          const isCurrent = index === currentTurn;
          const isPlayerA = index === 0;
          const isLastReceiver = index === lastReceiver;

          const cards =
            isGameOver || isPlayerA
              ? player.hand
              : isLastReceiver
              ? player.hand.map((card, i) => (i === 0 ? lastPassedCard : null))
              : player.hand.map(() => null);

          return (
            <div
              key={index}
              className={`${layoutStyle} bg-[#0b1e2e]/80 p-4 rounded-xl shadow-md transition-all duration-300 ${
                isCurrent ? "ring-animation" : ""
              } ${
                winner === player.name
                  ? "ring-2 ring-yellow-400 shadow-yellow-300"
                  : ""
              }`}
            >
              <p className="text-sm font-bold text-center mb-2">
                {player.name}
                {winner === player.name && (
                  <span className="text-yellow-400 ml-2 animate-bounce">
                    🏆
                  </span>
                )}
              </p>
              <div
                className={`flex ${
                  pos === 0 ? "flex-row" : "flex-wrap justify-center"
                } gap-2`}
              >
                {cards.map((card, cardIdx) => {
                  const cardInfo = generateCardImage(card);
                  return (
                    <div
                      key={cardIdx}
                      className={`w-[90px] h-[130px] border-2 rounded-md overflow-hidden transition-all duration-200 ${
                        index === 0 && isCurrent
                          ? "hover:border-yellow-400 cursor-pointer"
                          : "opacity-60 border-transparent"
                      }`}
                      onClick={() =>
                        index === 0 && isCurrent && passCard(index, cardIdx)
                      }
                    >
                      {card !== null ? (
                        <Image
                          src={cardInfo.image}
                          alt={cardInfo.name}
                          width={90}
                          height={130}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gray-800 ${
                            isCurrent ? "shimmer2" : ""
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
    </div>
  );
}
