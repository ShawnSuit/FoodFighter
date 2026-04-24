import type { Food, Matchup, Bracket } from './types';

function shuffle<T>(arr: T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nextPowerOfTwo(n: number): number {
  if (n <= 2) return 2;
  return 2 ** Math.ceil(Math.log2(n));
}

function buildMatchupId(round: number, index: number): string {
  return `r${round}-m${index}`;
}

function firstUndecided(round: Matchup[], from: number = 0): number {
  let i = from;
  while (i < round.length && round[i].winner !== null) i++;
  return i;
}

export function seedBracket(foods: Food[]): Bracket {
  if (foods.length < 2) {
    throw new Error('seedBracket: need at least 2 foods');
  }
  const shuffled = shuffle(foods);
  const size = nextPowerOfTwo(shuffled.length);
  const totalRounds = Math.log2(size);
  const byeCount = size - shuffled.length;
  const byeFoods = shuffled.slice(0, byeCount);
  const playingFoods = shuffled.slice(byeCount);

  const round0: Matchup[] = [];
  let m = 0;
  for (const food of byeFoods) {
    round0.push({
      id: buildMatchupId(0, m++),
      foodA: food,
      foodB: null,
      winner: null,
    });
  }
  for (let i = 0; i < playingFoods.length; i += 2) {
    round0.push({
      id: buildMatchupId(0, m++),
      foodA: playingFoods[i],
      foodB: playingFoods[i + 1],
      winner: null,
    });
  }
  const rounds: Matchup[][] = [round0];
  for (let r = 1; r < totalRounds; r++) {
    const count = size / 2 ** (r + 1);
    const round: Matchup[] = [];
    for (let m = 0; m < count; m++) {
      round.push({
        id: buildMatchupId(r, m),
        foodA: null,
        foodB: null,
        winner: null,
      });
    }
    rounds.push(round);
  }

  let bracket: Bracket = {
    rounds,
    currentRound: 0,
    currentMatchup: 0,
    champion: null,
  };

  for (const match of round0) {
    if (match.foodA && !match.foodB) {
      bracket = pickWinner(bracket, match.id, match.foodA.id);
    }
  }

  return bracket;
}

export function pickWinner(
  bracket: Bracket,
  matchupId: string,
  winnerId: string,
): Bracket {
  let foundRound = -1;
  let foundIndex = -1;
  for (let r = 0; r < bracket.rounds.length; r++) {
    const i = bracket.rounds[r].findIndex((m) => m.id === matchupId);
    if (i !== -1) {
      foundRound = r;
      foundIndex = i;
      break;
    }
  }
  if (foundRound === -1) {
    throw new Error(`pickWinner: matchup ${matchupId} not found`);
  }

  const matchup = bracket.rounds[foundRound][foundIndex];
  const winner =
    matchup.foodA?.id === winnerId
      ? matchup.foodA
      : matchup.foodB?.id === winnerId
        ? matchup.foodB
        : null;
  if (!winner) {
    throw new Error(
      `pickWinner: ${winnerId} is not in matchup ${matchupId}`,
    );
  }

  const newRounds = bracket.rounds.map((r) => r.slice());
  newRounds[foundRound][foundIndex] = { ...matchup, winner };

  let newChampion = bracket.champion;
  if (foundRound + 1 < newRounds.length) {
    const nextIndex = Math.floor(foundIndex / 2);
    const nextSlot: 'foodA' | 'foodB' = foundIndex % 2 === 0 ? 'foodA' : 'foodB';
    const nextMatchup = newRounds[foundRound + 1][nextIndex];
    newRounds[foundRound + 1][nextIndex] = {
      ...nextMatchup,
      [nextSlot]: winner,
    };
  } else {
    newChampion = winner;
  }

  const currentRoundArr = newRounds[bracket.currentRound];
  const newCurrentMatchup = firstUndecided(currentRoundArr, 0);

  return {
    ...bracket,
    rounds: newRounds,
    currentMatchup: newCurrentMatchup,
    champion: newChampion,
  };
}

export function getCurrentMatchup(bracket: Bracket): Matchup | null {
  const round = bracket.rounds[bracket.currentRound];
  if (!round) return null;
  for (let i = bracket.currentMatchup; i < round.length; i++) {
    if (round[i].winner === null) return round[i];
  }
  return null;
}

export function advanceRound(bracket: Bracket): Bracket {
  if (bracket.currentRound + 1 >= bracket.rounds.length) {
    return bracket;
  }
  return {
    ...bracket,
    currentRound: bracket.currentRound + 1,
    currentMatchup: 0,
  };
}

export function getChampion(bracket: Bracket): Food | null {
  return bracket.champion;
}
