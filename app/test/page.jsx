"use client"

import { useState } from "react"
import Image from "next/image"

const cardTypes = [
  { id: 1, name: "Dog", image: "/assets/dog.webp", points: 1000 },
  { id: 2, name: "Cat", image: "/assets/cat.jpg", points: 850 },
  { id: 3, name: "Bunny", image: "/assets/bunny.jpg", points: 700 },
  { id: 4, name: "Panda", image: "/assets/panda.jpg", points: 500 },
  { id: 0, name: "Null", image: "/assets/Null.png", points: 0 },
]

const generateCardImage = (id) => cardTypes.find(c => c.id === parseInt(id)) || cardTypes[4]

export default function TestGamePage() {
  const [players, setPlayers] = useState(() => {
    const fullDeck = [
      "1", "1", "1", "1",
      "2", "2", "2", "2",
      "3", "3", "3", "3",
      "4", "4", "4", "4",
      "0"
    ]

    const shuffle = (arr) => {
      let newArr = [...arr]
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
      }
      return newArr
    }

    const deck = shuffle(fullDeck)
    const nullIndex = deck.indexOf("0")
    const player0Hand = deck.splice(nullIndex, 1)
    player0Hand.push(...deck.splice(0, 4))

    const playerHands = [[], [], [], []]
    playerHands[0] = player0Hand
    for (let i = 1; i < 4; i++) {
      playerHands[i] = deck.splice(0, 4)
    }

    return [
      { name: "Player A", hand: playerHands[0] },
      { name: "Player B", hand: playerHands[1] },
      { name: "Player C", hand: playerHands[2] },
      { name: "Player D", hand: playerHands[3] },
    ]
  })

  const [currentTurn, setCurrentTurn] = useState(0)
  const [lastPassedCard, setLastPassedCard] = useState(null)
  const [lastReceiver, setLastReceiver] = useState(null)

  const passCard = (playerIndex, cardIndex) => {
    const currentPlayer = players[playerIndex]
    const nextPlayerIndex = (playerIndex + 1) % 4
    const card = currentPlayer.hand[cardIndex]
    const isGameStart = currentPlayer.hand.length === 5

    if (isGameStart && card === "0") {
      alert("❌ You can't pass the null card on the first move.")
      return
    }

    const isPassingBackSameCard =
      lastReceiver === playerIndex && card === lastPassedCard

    if (isPassingBackSameCard) {
      const count = currentPlayer.hand.filter(c => c === card).length
      if (count < 2) {
        alert("❌ You can't pass back the card just received unless you have more than one.")
        return
      }
    }

    const newPlayers = [...players]
    newPlayers[playerIndex].hand.splice(cardIndex, 1)
    newPlayers[nextPlayerIndex].hand.push(card)

    setPlayers(newPlayers)
    setLastPassedCard(card)
    setLastReceiver(nextPlayerIndex)
    setCurrentTurn(nextPlayerIndex)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col gap-6 items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">🃏 4 Cards Test Game</h1>

      <div className="grid grid-cols-2 gap-12 max-w-6xl">
        {players.map((player, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className={`text-lg font-semibold mb-2 ${index === currentTurn ? "text-green-400" : ""}`}>
              {player.name} {index === currentTurn && "(Your Turn)"}
            </h2>
            <div className="flex gap-2">
              {player.hand.map((card, cardIdx) => {
                const cardInfo = generateCardImage(card)
                return (
                  <div
                    key={cardIdx}
                    className={`relative border rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition ${
                      index === currentTurn ? "hover:border-green-500" : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => index === currentTurn && passCard(index, cardIdx)}
                  >
                    <Image src={cardInfo.image} alt={cardInfo.name} width={80} height={120} />
                    <div className="absolute bottom-0 w-full text-center text-xs bg-black/60 py-1">
                      {cardInfo.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
