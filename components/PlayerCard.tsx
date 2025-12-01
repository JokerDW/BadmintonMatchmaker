import React from 'react';
import { Player, Gender } from '../types';
import { User, Shield, Users } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isOnCourt?: boolean;
  isInPrep?: boolean;
  onClick?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isSelected, 
  isOnCourt, 
  isInPrep,
  onClick 
}) => {
  // If in prep, don't show (per requirement 3)
  if (isInPrep) return null;

  const baseClasses = "relative flex flex-col p-3 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 select-none";
  
  // Default State
  let stateClasses = "bg-white border-brand-200 hover:border-brand-300 hover:shadow-md dark:bg-brand-800 dark:border-brand-700 dark:hover:border-brand-500";
  
  // Prioritize selection style over on-court style
  if (isSelected) {
    // Brand Primary (Dark) for Border in Light Mode, Accent (Light) in Dark Mode
    stateClasses = "bg-brand-50 border-brand-500 ring-2 ring-brand-500 z-10 dark:bg-brand-700 dark:border-brand-300 dark:ring-brand-300";
  } else if (isOnCourt) {
    stateClasses = "bg-gray-100 border-gray-200 text-gray-400 dark:bg-brand-900 dark:border-brand-800 dark:text-brand-600";
  }

  // Update gender colors to match the earthy tone or keep distinct? Keeping distinct but slightly muted.
  const genderColor = player.gender === Gender.MALE 
    ? 'text-sky-600 dark:text-sky-400' 
    : 'text-rose-500 dark:text-rose-400';

  return (
    <div 
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <User className={`w-4 h-4 ${genderColor}`} />
          <span className={`font-bold truncate max-w-[80px] ${isOnCourt && !isSelected ? 'text-inherit' : 'text-brand-800 dark:text-brand-100'}`} title={player.name}>
            {player.name}
          </span>
        </div>
        <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-semibold ${
             isOnCourt && !isSelected 
             ? 'bg-gray-200 text-gray-500 dark:bg-brand-800 dark:text-brand-600' 
             : 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300'
          }`}>
          <Shield className="w-3 h-3" />
          <span>Lv.{player.level}</span>
        </div>
      </div>
      
      <div className={`flex justify-between items-end mt-auto text-xs ${isOnCourt && !isSelected ? 'text-inherit' : 'text-brand-500 dark:text-brand-400'}`}>
        <div className="flex flex-col">
          {player.partner && (
             <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-500" title={`搭檔: ${player.partner}`}>
               <Users className="w-3 h-3" />
               <span className="truncate max-w-[60px]">{player.partner}</span>
             </div>
          )}
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
             isOnCourt && !isSelected 
             ? 'bg-gray-200 dark:bg-brand-800' 
             : 'bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-brand-200'
        }`}>
          Games: {player.gamesPlayed}
        </div>
      </div>

      {isOnCourt && !isSelected && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center rounded-lg pointer-events-none">
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider bg-white/80 dark:bg-black/80 px-2 py-1 rounded">In Game</span>
        </div>
      )}
      
      {isOnCourt && isSelected && (
        <div className="absolute top-1 right-1 pointer-events-none">
             <span className="flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 dark:bg-brand-300"></span>
             </span>
        </div>
      )}
    </div>
  );
};