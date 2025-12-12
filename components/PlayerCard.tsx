import React from 'react';
import { Player, Gender } from '../types';
import { User, Shield, Users, Pencil, Sparkles, Swords } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isSelected?: boolean;
  isOnCourt?: boolean;
  isInPrep?: boolean;
  isRecommended?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isSelected, 
  isOnCourt, 
  isInPrep,
  isRecommended,
  onClick,
  onEdit
}) => {
  // If in prep, don't show
  if (isInPrep) return null;

  const baseClasses = "relative flex flex-col p-3 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 select-none group";
  
  // Default State
  let stateClasses = "bg-white border-brand-200 hover:border-brand-300 hover:shadow-md dark:bg-brand-800 dark:border-brand-700 dark:hover:border-brand-500";
  
  // State Priority: Selected > Recommended > OnCourt > Default
  if (isSelected) {
    stateClasses = "bg-brand-50 border-brand-500 ring-2 ring-brand-500 z-10 dark:bg-brand-700 dark:border-brand-300 dark:ring-brand-300";
  } else if (isRecommended) {
    stateClasses = "bg-amber-50 border-amber-400 ring-2 ring-amber-400/50 shadow-amber-100 dark:bg-amber-900/20 dark:border-amber-500/50 dark:ring-amber-500/30";
  } else if (isOnCourt) {
    // High contrast for readability, but visually distinct (slightly dimmed background)
    stateClasses = "bg-gray-100 border-gray-300 dark:bg-black/20 dark:border-brand-800";
  }

  const genderColor = player.gender === Gender.MALE 
    ? 'text-sky-600 dark:text-sky-400' 
    : 'text-rose-500 dark:text-rose-400';

  // For on-court players, we use a slightly muted text color but keep it readable
  const textColor = isOnCourt && !isSelected 
    ? 'text-gray-600 dark:text-brand-400' 
    : 'text-brand-800 dark:text-brand-100';

  return (
    <div 
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2 pr-6">
        <div className="flex items-center space-x-2 overflow-hidden">
          <User className={`w-4 h-4 shrink-0 ${genderColor}`} />
          <span className={`font-bold truncate ${textColor}`} title={player.name}>
            {player.name}
          </span>
        </div>
        
        {/* Recommended Icon Badge */}
        {isRecommended && !isSelected && !isOnCourt && (
           <div className="absolute top-2 right-8 text-amber-500 animate-pulse">
              <Sparkles className="w-3 h-3" />
           </div>
        )}

        {/* On Court Badge */}
        {isOnCourt && !isSelected && (
           <div className="absolute top-2 right-8 flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-brand-800 px-1.5 py-0.5 rounded">
              <Swords className="w-3 h-3 mr-1" />
              比賽中
           </div>
        )}

        {/* Edit Button - Always visible now */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit();
          }}
          className={`absolute top-2 right-2 p-1 rounded-full transition-colors hover:bg-brand-200 dark:hover:bg-brand-600 ${isSelected ? 'text-brand-700 dark:text-brand-200' : 'text-brand-400 dark:text-brand-500'}`}
          title="編輯球員"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mb-2">
        <div className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-xs font-semibold ${
             isOnCourt && !isSelected 
             ? 'bg-gray-200 text-gray-600 dark:bg-brand-900 dark:text-brand-500' 
             : 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-300'
          }`}>
          <Shield className="w-3 h-3" />
          <span>Lv.{player.level}</span>
        </div>
      </div>
      
      <div className={`flex justify-between items-end mt-auto text-xs ${isOnCourt && !isSelected ? 'text-gray-500 dark:text-brand-500' : 'text-brand-500 dark:text-brand-400'}`}>
        <div className="flex flex-col">
          {player.partner && (
             <div className={`flex items-center space-x-1 ${isOnCourt && !isSelected ? 'text-amber-700/70 dark:text-amber-600/70' : 'text-amber-600 dark:text-amber-500'}`} title={`搭檔: ${player.partner}`}>
               <Users className="w-3 h-3" />
               <span className="truncate max-w-[60px]">{player.partner}</span>
             </div>
          )}
        </div>
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
             isOnCourt && !isSelected 
             ? 'bg-gray-200 dark:bg-brand-900 text-gray-600 dark:text-brand-400' 
             : 'bg-brand-100 text-brand-700 dark:bg-brand-700 dark:text-brand-200'
        }`}>
          Games: {player.gamesPlayed}
        </div>
      </div>
      
      {isOnCourt && isSelected && (
        <div className="absolute -top-1 -right-1 pointer-events-none z-20">
             <span className="flex h-2 w-2">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500 dark:bg-brand-300"></span>
             </span>
        </div>
      )}
    </div>
  );
};