import { Food, Matchup, Bracket } from "./types";

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function seedBracket(foods: Food[]): Bracket {
  const size = nextPowerOf2(foods.length);
  const shuffled = shuffle(foods);

  const padded: (Food | null)[] = [...shuffled];
  while (padded.length < size) padded.push(null);

  const matchups: Matchup[] = [];
  for (let i = 0; i < size; i += 2) {
    const foodA = padded[i]!;
    const foodB = padded[i + 1];
    const isBye = foodB === null;
    matchups.push({
      id: `r0-m${i / 2}`,
      foodA,
      foodB,
      winner: isBye ? foodA : null,
    });
  }

  const totalRounds = Math.log2(size);
  const rounds: Matchup[][] = [matchups];
  for (let r = 1; r < totalRounds; r++) {
    const prevCount = rounds[r - 1].length;
    const round: Matchup[] = [];
    for (let m = 0; m < prevCount / 2; m++) {
      round.push({ id: `r${r}-m${m}`, foodA: null!, foodB: null, winner: null });
    }
    rounds.push(round);
  }

  let bracket: Bracket = { rounds, currentRound: 0, currentMatchup: 0, champion: null };

  const allByesResolved = rounds[0].every((m) => m.winner !== null);
  if (allByesResolved && rounds.length > 1) {
    bracket = advanceRound(bracket);
  }

  return bracket;
}

export function pickWinner(bracket: Bracket, matchupId: string, winnerId: string): Bracket {
  const rounds = bracket.rounds.map((round) =>
    round.map((m) => {
      if (m.id !== matchupId) return m;
      const winner = m.foodA?.id === winnerId ? m.foodA : m.foodB;
      return { ...m, winner };
    })
  );

  const r = bracket.currentRound;
  const nextMatchupIndex = bracket.currentMatchup + 1;
  const roundComplete = nextMatchupIndex >= rounds[r].length;

  const updated: Bracket = {
    ...bracket,
    rounds,
    currentMatchup: roundComplete ? bracket.currentMatchup : nextMatchupIndex,
  };

  if (roundComplete) {
    const isFinal = r === rounds.length - 1;
    if (isFinal) {
      const finalWinner = rounds[r].find((m) => m.id === matchupId)!;
      const champion =
        finalWinner.foodA?.id === winnerId ? finalWinner.foodA : finalWinner.foodB;
      return { ...updated, champion };
    }
  }

  return updated;
}

export function getCurrentMatchup(bracket: Bracket): Matchup | null {
  if (bracket.champion) return null;
  const round = bracket.rounds[bracket.currentRound];
  if (!round) return null;

  for (let i = bracket.currentMatchup; i < round.length; i++) {
    const m = round[i];
    if (m.winner === null && m.foodA && m.foodB) return m;
  }
  return null;
}

export function advanceRound(bracket: Bracket): Bracket {
  const nextRoundIndex = bracket.currentRound + 1;
  if (nextRoundIndex >= bracket.rounds.length) return bracket;

  const currentRoundMatchups = bracket.rounds[bracket.currentRound];
  const winners = currentRoundMatchups.map((m) => m.winner!);

  const nextRound = bracket.rounds[nextRoundIndex].map((m, i) => {
    const foodA = winners[i * 2] ?? null;
    const foodB = winners[i * 2 + 1] ?? null;
    const isBye = foodA !== null && foodB === null;
    return {
      ...m,
      foodA: foodA!,
      foodB,
      winner: isBye ? foodA : null,
    };
  });

  const rounds = bracket.rounds.map((r, i) => (i === nextRoundIndex ? nextRound : r));

  let result: Bracket = {
    ...bracket,
    rounds,
    currentRound: nextRoundIndex,
    currentMatchup: 0,
  };

  const allResolved = nextRound.every((m) => m.winner !== null);
  if (allResolved && nextRoundIndex < rounds.length - 1) {
    result = advanceRound(result);
  }

  return result;
}

export function getChampion(bracket: Bracket): Food | null {
  return bracket.champion;
}
