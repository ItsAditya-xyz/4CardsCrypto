export function distributeCards(players) {
  const fullDeck = [
    "1", "1", "1", "1",
    "2", "2", "2", "2",
    "3", "3", "3", "3",
    "4", "4", "4", "4",
    "0",
  ];

  const maxAttempts = 10000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const deck = [...fullDeck];
    const shuffledDeck = deck.sort(() => Math.random() - 0.5);
    const nullHolderIndex = Math.floor(Math.random() * 4);

    const playerStates = players.map((p) => ({
      user_id: p.id,
      hand: [],
      last_received: null,
    }));

    const maxCards = playerStates.map((_, i) =>
      i === nullHolderIndex ? 5 : 4
    );
    const handLimits = Array(4).fill(0).map(() => ({}));

    // Assign the 0 card
    const zeroIndex = shuffledDeck.indexOf("0");
    playerStates[nullHolderIndex].hand.push("0");
    handLimits[nullHolderIndex]["0"] = 1;
    shuffledDeck.splice(zeroIndex, 1);

    let success = true;

    for (const card of shuffledDeck) {
      const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      let placed = false;

      for (const i of indices) {
        const hand = playerStates[i].hand;
        const limit = handLimits[i];

        if (hand.length >= maxCards[i]) continue;
        if ((limit[card] || 0) >= 2) continue;

        hand.push(card);
        limit[card] = (limit[card] || 0) + 1;
        placed = true;
        break;
      }

      if (!placed) {
        success = false;
        break;
      }
    }

    if (success) {
      return {
        playerStates,
        turnIndex: nullHolderIndex,
      };
    }
  }

  throw new Error("Failed to distribute cards after many attempts");
}
