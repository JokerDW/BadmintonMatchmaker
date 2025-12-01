import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { MatchupCard } from './MatchupCard';
import { Matchup } from '../types';

interface PreparationAreaProps {
  onSelectMatchup?: (matchup: Matchup) => void;
  selectedMatchupId?: number;
}

export const PreparationArea: React.FC<PreparationAreaProps> = ({ onSelectMatchup, selectedMatchupId }) => {
  const matchups = useLiveQuery(() => db.matchups.toArray());

  const handleDelete = (id: number) => {
    if (window.confirm('確定要刪除這個組合嗎？')) {
      db.matchups.delete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-50 dark:bg-brand-900 border-l border-brand-200 dark:border-brand-700">
      <div className="p-4 border-b border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-800">
        <h3 className="font-bold text-brand-700 dark:text-brand-100">預備區 ({matchups?.length || 0})</h3>
        <p className="text-xs text-brand-500 dark:text-brand-400 mt-1">點選組合可分配場地，或直接刪除</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {matchups?.length === 0 && (
          <div className="text-center text-brand-400 dark:text-brand-600 py-10 text-sm">
            目前沒有預備組合
          </div>
        )}
        {matchups?.map(matchup => (
          <MatchupCard 
            key={matchup.id} 
            matchup={matchup} 
            onDelete={() => handleDelete(matchup.id!)}
            onClick={() => onSelectMatchup && onSelectMatchup(matchup)}
            selected={selectedMatchupId === matchup.id}
          />
        ))}
      </div>
    </div>
  );
};