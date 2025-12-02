import { db } from '../db';
import { Player, Gender } from '../types';

export const getSelectionWarnings = async (selectedPlayers: Player[]) => {
  const warnings: { type: 'yellow' | 'red'; message: string }[] = [];

  // 1. Check Partner Logic (Red Warning)
  for (const player of selectedPlayers) {
    if (player.partner) {
      const partnerInSelection = selectedPlayers.find(p => p.name === player.partner);
      if (!partnerInSelection) {
        warnings.push({
          type: 'red',
          message: `${player.name} 的搭檔是 ${player.partner}，但未入選！`
        });
      }
    }
  }

  // 2. Check History (Yellow Warning)
  const history = await db.history.toArray();
  const playerIds = selectedPlayers.map(p => p.id!);

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const id1 = playerIds[i];
      const id2 = playerIds[j];
      
      let count = 0;
      for (const h of history) {
        if (h.playerIds.includes(id1) && h.playerIds.includes(id2)) {
          count++;
        }
      }

      if (count > 0) {
        const p1 = selectedPlayers.find(p => p.id === id1);
        const p2 = selectedPlayers.find(p => p.id === id2);
        const arePartners = p1?.partner === p2?.name || p2?.partner === p1?.name;

        if (!arePartners) {
             warnings.push({
            type: 'yellow',
            message: `${p1?.name} 和 ${p2?.name} 已經同場過 ${count} 次`
          });
        }
      }
    }
  }

  return warnings;
};

// --- Recommendation Logic ---

const getStandardDeviation = (array: number[]) => {
    if (array.length === 0) return 0;
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const getHistoryOverlapScore = async (players: Player[]) => {
    // Lower is better
    const history = await db.history.toArray();
    let conflictScore = 0;
    const ids = players.map(p => p.id!);

    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
             // Simple check: how many times have these two played together?
             const id1 = ids[i];
             const id2 = ids[j];
             const count = history.filter(h => h.playerIds.includes(id1) && h.playerIds.includes(id2)).length;
             conflictScore += count;
        }
    }
    return conflictScore;
};

export const findBestMatchup = async (availablePlayers: Player[]): Promise<number[]> => {
    if (availablePlayers.length < 4) return [];

    // 1. Primary Filter: Games Played (Sort ASC)
    // Priority 1: Games Played. We create a pool of players with the lowest game counts.
    // Sorting first ensures we are looking at the right candidates.
    const sortedByGames = [...availablePlayers].sort((a, b) => {
        if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed;
        return 0.5 - Math.random(); // Randomize slightly if games are equal to rotate players
    });
    
    // Take a larger pool (e.g., top 16) to allow for partner constraints and gender balancing logic
    // to work within the "Low Games" group.
    const poolSize = Math.min(16, sortedByGames.length);
    const candidatePool = sortedByGames.slice(0, poolSize);

    // Generate combinations of 4 from the pool
    const combinations: Player[][] = [];
    const f = (start: number, current: Player[]) => {
        if (current.length === 4) {
            combinations.push([...current]);
            return;
        }
        for (let i = start; i < candidatePool.length; i++) {
            f(i + 1, [...current, candidatePool[i]]);
        }
    };
    f(0, []);

    let bestCombo: Player[] | null = null;
    let bestScore = Infinity; // Lower is better

    // Priority Order Weights:
    // 1. Games Played (Base) -> Handled by pool selection + Score Weight
    // 2. Level Similarity -> Score Weight
    // 3. Gender Ratio (Even females) -> Score Weight
    // 4. Partner Together -> Score Weight
    // 5. History Overlap -> Score Weight

    for (const combo of combinations) {
        
        // --- 1. Games Score (Base Priority) ---
        // Sum of games. Multiplier: 10,000,000
        // This ensures that a group with total games 0 always beats a group with total games 1,
        // regardless of level/gender (unless level gap is catastrophic, but here we prioritize games).
        const gamesSum = combo.reduce((sum, p) => sum + p.gamesPlayed, 0);
        const gamesScore = gamesSum * 10_000_000;

        // --- 2. Level Score ---
        // Standard Deviation. Multiplier: 100,000
        // SD range is usually 0~10. So score is 0 ~ 1,000,000.
        // A difference of 1 gamesPlayed (10M score) outweighs the worst level gap.
        const levels = combo.map(p => p.level);
        const stdDev = getStandardDeviation(levels);
        const levelScore = stdDev * 100_000;

        // --- 3. Gender Score ---
        // Rule: Avoid odd number of females. (0, 2, 4 are good. 1, 3 are bad).
        // Priority 3, so its penalty should be smaller than a significant Level gap, 
        // but large enough to differentiate similar level groups.
        // Let's say we tolerate a standard deviation increase of ~0.5 to fix gender.
        // 0.5 SD * 100,000 = 50,000.
        const femaleCount = combo.filter(p => p.gender === Gender.FEMALE).length;
        const isOddFemales = femaleCount % 2 !== 0;
        const genderScore = isOddFemales ? 50_000 : 0;

        // --- 4. Partner Score ---
        // Priority 4.
        // Rule: If A is in combo, and A has partner B, and B is AVAILABLE but NOT in combo -> Bad.
        // Bonus: If A and B are both in combo -> Good (Small bonus to act as tie breaker).
        let partnerPenalty = 0;
        for (const p of combo) {
            if (p.partner) {
                const partnerName = p.partner;
                
                // Check if partner is in current combo
                const partnerInCombo = combo.find(c => c.name === partnerName);
                
                if (partnerInCombo) {
                    // Good: Playing together. Slight bonus (negative score).
                    partnerPenalty -= 1_000; 
                } else {
                    // Partner not in combo. Is partner available in the candidate pool?
                    // We check 'availablePlayers' (the big list) to see if we "broke" them up.
                    const partnerAvailable = availablePlayers.find(ap => ap.name === partnerName);
                    if (partnerAvailable) {
                        // Bad: Partner is waiting but we didn't pick them.
                        // Penalty should be lower than Gender Issue (50k).
                        partnerPenalty += 25_000;
                    }
                }
            }
        }

        // --- 5. History Score ---
        // Priority 5. Tie breaker.
        const historyScore = await getHistoryOverlapScore(combo); // Raw count, usually 0-10.

        const totalScore = gamesScore + levelScore + genderScore + partnerPenalty + historyScore;

        if (totalScore < bestScore) {
            bestScore = totalScore;
            bestCombo = combo;
        }
    }

    return bestCombo ? bestCombo.map(p => p.id!) : [];
};