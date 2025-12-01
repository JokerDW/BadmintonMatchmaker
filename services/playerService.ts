import { db } from '../db';
import { Player } from '../types';

export const getSelectionWarnings = async (selectedPlayers: Player[]) => {
  const warnings: { type: 'yellow' | 'red'; message: string }[] = [];

  // 1. Check Partner Logic (Red Warning)
  // If player A has partner B, and B is NOT in the selected list -> Warning
  // OR if A and B are both in list, but implied partner logic mismatches (less critical but good to know)
  
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
  // Check every pair combination
  const history = await db.history.toArray();
  const playerIds = selectedPlayers.map(p => p.id!);

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const id1 = playerIds[i];
      const id2 = playerIds[j];
      
      // Count how many times these two appeared in the same history entry
      let count = 0;
      for (const h of history) {
        if (h.playerIds.includes(id1) && h.playerIds.includes(id2)) {
          count++;
        }
      }

      if (count > 0) {
        // Only show warning if they are NOT defined partners (Requirement: ignore if partners)
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
