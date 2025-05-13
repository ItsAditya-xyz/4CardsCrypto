"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const cardTypes = [
  { id: 1, name: "Dog", image: "/assets/dog.webp", points: 1000 },
  { id: 2, name: "Cat", image: "/assets/cat.jpg", points: 850 },
  { id: 3, name: "Bunny", image: "/assets/bunny.jpg", points: 700 },
  { id: 4, name: "Panda", image: "/assets/panda.jpg", points: 500 },
  { id: 0, name: "Null", image: "/assets/Null.png", points: 0 },
];

const generateCardImage = (id) =>
  cardTypes.find((c) => c.id === parseInt(id)) || cardTypes[4];

export default function TestGamePage() {
  const createInitialPlayers = () => {
    const fullDeck = [
      "1",
      "1",
      "1",
      "1",
      "2",
      "2",
      "2",
      "2",
      "3",
      "3",
      "3",
      "3",
      "4",
      "4",
      "4",
      "4",
      "0",
    ];

    const shuffle = (arr) => {
      let newArr = [...arr];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    const deck = shuffle(fullDeck);
    const nullIndex = deck.indexOf("0");
    const player0Hand = deck.splice(nullIndex, 1);
    player0Hand.push(...deck.splice(0, 4));

    const playerHands = [[], [], [], []];
    playerHands[0] = player0Hand;
    for (let i = 1; i < 4; i++) {
      playerHands[i] = deck.splice(0, 4);
    }

    return [
      { name: "Player A", hand: player0Hand },
      { name: "Player B", hand: playerHands[1] },
      { name: "Player C", hand: playerHands[2] },
      { name: "Player D", hand: playerHands[3] },
    ];
  };

  const [players, setPlayers] = useState(createInitialPlayers);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [lastPassedCard, setLastPassedCard] = useState(null);
  const [lastReceiver, setLastReceiver] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const resetGame = () => {
    setPlayers(createInitialPlayers());
    setCurrentTurn(0);
    setLastPassedCard(null);
    setLastReceiver(null);
    setWinner(null);
  };

  const passCard = (playerIndex, cardIndex) => {
    if (winner !== null) return;

    const currentPlayer = players[playerIndex];
    const nextPlayerIndex = (playerIndex + 1) % 4;
    const card = currentPlayer.hand[cardIndex];
    const isFirstTurn = playerIndex === 0 && lastPassedCard === null;

    if (isFirstTurn && card === "0") {
      alert("❌ You can't pass the null card on the first move.");
      return;
    }

    const isPassingBackSameCard =
      lastReceiver === playerIndex && card === lastPassedCard;

    if (isPassingBackSameCard) {
      const count = currentPlayer.hand.filter((c) => c === card).length;
      if (count < 2) {
        alert(
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

    if (hasWon) {
      setWinner(newPlayers[nextPlayerIndex].name);
    }
  };

  const me = 0;
  const getRelativeIndex = (index) => (index - me + 4) % 4;

  return (
    <div
      className='min-h-screen text-white flex flex-col gap-6 items-center justify-center p-4'
      style={{
        backgroundImage: "url(/assets/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}>
      <h1 className='text-4xl font-extrabold text-yellow-300 drop-shadow-sm text-center'>
        4 Cards Test Game
      </h1>
      <h2 className='text-xl font-semibold text-green-200 mb-6 text-center'>
        {players[currentTurn].name}&apos;s Turn
      </h2>

      {winner ? (
        <div className='text-center bg-black/60 p-6 rounded-lg'>
          <h2 className='text-3xl font-bold text-green-400'>
            🎉 {winner} wins the game!
          </h2>
          <button
            onClick={resetGame}
            className='mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'>
            Restart Game
          </button>
        </div>
      ) : (
        <>
          {!isMobile ? (
            // 🖥️ Desktop layout
            <div className='relative w-full  h-[75vh] bg-red-500 '>
              {players.map((player, index) => {
                const pos = getRelativeIndex(index);
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

                return (
                  <div
                    key={index}
                    className={`${layoutStyle} bg-[#0b1e2e]/80 p-4 rounded-xl shadow-md `}>
                    <h2
                      className={`text-md font-bold mb-2 ${
                        isCurrent ? "text-yellow-300" : "text-white"
                      }`}>
                      {player.name}
                    </h2>
                    <div
                      className={`flex ${
                        isPlayerA ? "flex-row" : "flex-wrap justify-center"
                      } gap-3`}>
                      {player.hand.map((card, cardIdx) => {
                        const cardInfo = generateCardImage(card);
                        return (
                          <div
                            key={cardIdx}
                            className={`border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                              isCurrent
                                ? "hover:border-yellow-400 cursor-pointer"
                                : "opacity-60 border-transparent"
                            }`}
                            onClick={() =>
                              isCurrent && passCard(index, cardIdx)
                            }>
                            <div className='w-[200px] h-[280px] flex items-center justify-center overflow-hidden rounded-lg border-2'>
                              <Image
                                src={cardInfo.image}
                                alt={cardInfo.name}
                                width={130}
                                height={280}
                                className='object-cover w-full h-full transition-transform duration-200 transform hover:scale-105'
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // 📱 Mobile layout
            <div className='grid grid-cols-2 gap-4 w-full max-w-[440px] mx-auto'>
              {players.map((player, index) => {
                const isCurrent = index === currentTurn;
                const isPlayerA = index === 0;

                return (
                  <div
                    key={index}
                    className='bg-[#0b1e2e]/80 p-2 rounded-lg shadow w-full flex flex-col items-center'>
                    <p
                      className={`text-sm font-bold mb-2 ${
                        isCurrent ? "text-yellow-300" : "text-white"
                      }`}>
                      {player.name}
                    </p>
                    <div
                      className={`flex ${
                        "flex-wrap justify-center"
                      } gap-1`}>
                      {player.hand.map((card, cardIdx) => {
                        const cardInfo = generateCardImage(card);
                        return (
                          <div
                            key={cardIdx}
                            className={`border-2 rounded-md overflow-hidden transition-all duration-200 ${
                              isCurrent
                                ? "hover:border-yellow-400 cursor-pointer"
                                : "opacity-50 border-transparent"
                            }`}
                            onClick={() =>
                              isCurrent && passCard(index, cardIdx)
                            }>
                            <Image
                              src={cardInfo.image}
                              alt={cardInfo.name}
                              width={80}
                              height={110}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
