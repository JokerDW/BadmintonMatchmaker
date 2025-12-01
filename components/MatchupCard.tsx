import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { Matchup, Player } from '../types';
import { Trash2 } from 'lucide-react';

interface MatchupCardProps {
  matchup: Matchup;
  onClick?: () => void;
  onDelete?: () => void;
  selected?: boolean;
}

export const MatchupCard: React.FC<MatchupCardProps> = ({ matchup, onClick, onDelete, selected }) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    db.players.where('id').anyOf(matchup.playerIds).toArray().then(setPlayers);
  }, [matchup.playerIds]);

  if (players.length === 0) return <div className="animate-pulse h-20 bg-brand-100 dark:bg-brand-800 rounded-lg"></div>;

  // Calculate average level
  const avgLevel = (players.reduce((sum, p) => sum + p.level, 0) / players.length).toFixed(1);

  return (
    <div 
      className={`relative group bg-white dark:bg-brand-800 p-3 rounded-lg border shadow-sm transition-all cursor-pointer ${
        selected 
          ? 'ring-2 ring-brand-500 border-brand-500 dark:ring-brand-300 dark:border-brand-300' 
          : 'border-brand-200 dark:border-brand-700 hover:border-brand-300 dark:hover:border-brand-500'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-brand-500 dark:text-brand-300 bg-brand-50 dark:bg-brand-900 px-1.5 py-0.5 rounded border border-brand-100 dark:border-brand-700">
            Avg Lv.{avgLevel}
        </span>
        {onDelete && (
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(); }}
             className="text-brand-300 hover:text-red-500 dark:text-brand-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {players.map(p => (
          <div key={p.id} className="text-sm text-brand-700 dark:text-brand-200 truncate">
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
};