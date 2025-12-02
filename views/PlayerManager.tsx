import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Player, Gender } from '../types';
import { PlayerCard } from '../components/PlayerCard';
import { Button } from '../components/Button';
import { AddPlayerModal } from '../components/AddPlayerModal';
import { SettingsModal } from '../components/SettingsModal';
import { PreparationArea } from '../components/PreparationArea';
import { Plus, UserPlus, Trash2, AlertTriangle, AlertCircle, List, User, Settings, Sparkles } from 'lucide-react';
import { getSelectionWarnings, findBestMatchup } from '../services/playerService';

export const PlayerManager: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isPrepOpen, setIsPrepOpen] = useState(false); // Mobile Prep Drawer State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'games' | 'name' | 'gender' | 'level'>('games');
  
  // Recommendation State
  const [enableRecommendation, setEnableRecommendation] = useState(() => {
      return localStorage.getItem('enableRecommendation') === 'true';
  });
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);

  // Warnings State
  const [warnings, setWarnings] = useState<{ type: 'yellow' | 'red'; message: string }[]>([]);

  // Fetch Data
  const allPlayers = useLiveQuery(() => db.players.toArray(), []);
  const courts = useLiveQuery(() => db.courts.toArray(), []);
  const matchups = useLiveQuery(() => db.matchups.toArray(), []);
  // We need to listen to history changes to re-trigger recommendation
  const historyTrigger = useLiveQuery(() => db.history.count()); 

  // Derived IDs
  const playersOnCourt = useMemo(() => {
      const set = new Set<number>();
      courts?.forEach(c => c.players.forEach(p => set.add(p.id!)));
      return set;
  }, [courts]);
  
  const playersInPrep = useMemo(() => {
      const set = new Set<number>();
      matchups?.forEach(m => m.playerIds.forEach(id => set.add(id)));
      return set;
  }, [matchups]);

  // Persist Recommendation Setting
  const handleToggleRecommendation = (enabled: boolean) => {
      setEnableRecommendation(enabled);
      localStorage.setItem('enableRecommendation', String(enabled));
      if (!enabled) setRecommendedIds([]);
  };

  // Recommendation Engine Effect
  useEffect(() => {
    const runRecommendation = async () => {
        if (!enableRecommendation || !allPlayers) {
            setRecommendedIds([]);
            return;
        }
        
        // Only run recommendation on available players (exclude those already in prep)
        // Note: We INCLUDE players on court to allow queuing them for the next game
        const available = allPlayers.filter(p => !playersInPrep.has(p.id!));
        
        const bestIds = await findBestMatchup(available);
        setRecommendedIds(bestIds);
    };
    runRecommendation();
  }, [enableRecommendation, allPlayers, playersInPrep, historyTrigger]); // Re-run when these change (Removed playersOnCourt dependency for filtering)

  // Sorting and Grouping
  const { recommendedPlayers, otherPlayers } = useMemo(() => {
      if (!allPlayers) return { recommendedPlayers: [], otherPlayers: [] };

      // Base Sort
      const sorted = [...allPlayers].sort((a, b) => {
        if (sortBy === 'games') return a.gamesPlayed - b.gamesPlayed;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'gender') return a.gender.localeCompare(b.gender);
        if (sortBy === 'level') return b.level - a.level; // Descending
        return 0;
      });

      if (enableRecommendation) {
          if (recommendedIds.length > 0) {
              const rec = sorted.filter(p => recommendedIds.includes(p.id!));
              const others = sorted.filter(p => !recommendedIds.includes(p.id!));
              return { recommendedPlayers: rec, otherPlayers: others };
          } else {
              // Recommendation enabled but no group found (e.g. < 4 players)
              // All players go to "other", but UI will show placeholder in recommended section
              return { recommendedPlayers: [], otherPlayers: sorted };
          }
      }

      return { recommendedPlayers: [], otherPlayers: sorted };
  }, [allPlayers, sortBy, enableRecommendation, recommendedIds]);


  // Calculate stats for selected players
  const selectionStats = useMemo(() => {
    if (!allPlayers || selectedIds.length === 0) return { male: 0, female: 0 };
    const selected = allPlayers.filter(p => selectedIds.includes(p.id!));
    return {
      male: selected.filter(p => p.gender === Gender.MALE).length,
      female: selected.filter(p => p.gender === Gender.FEMALE).length
    };
  }, [selectedIds, allPlayers]);

  // Calculate warnings when selection changes
  useEffect(() => {
    const runCheck = async () => {
      if (selectedIds.length === 0) {
        setWarnings([]);
        return;
      }
      const selectedPlayers = (allPlayers || []).filter(p => selectedIds.includes(p.id!));
      const newWarnings = await getSelectionWarnings(selectedPlayers);
      setWarnings(newWarnings);
    };
    runCheck();
  }, [selectedIds, allPlayers]);

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(pid => pid !== id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds(prev => [...prev, id]);
      }
    }
  };

  const handleEditPlayer = (player: Player) => {
      setEditingPlayer(player);
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setEditingPlayer(null);
  };

  const addToPrep = async () => {
    if (selectedIds.length !== 4) return;
    
    await db.matchups.add({
      playerIds: selectedIds,
      timestamp: Date.now()
    });
    setSelectedIds([]);
  };

  const deleteSelectedPlayers = async () => {
      if (selectedIds.length === 0) return;
      if (window.confirm(`確定要刪除選取的 ${selectedIds.length} 位球員嗎？這將無法復原。`)) {
          await db.players.bulkDelete(selectedIds);
          setSelectedIds([]);
      }
  }

  const resetAllGames = async () => {
      if (window.confirm("確定要將所有球員的場次歸零並清除所有對戰紀錄嗎？")) {
          await (db as any).transaction('rw', db.players, db.history, async () => {
             await db.players.toCollection().modify({ gamesPlayed: 0 });
             await db.history.clear();
          });
          setIsSettingsOpen(false);
      }
  }
  
  const prepCount = matchups?.length || 0;

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Left: Player List */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-50 dark:bg-brand-900 transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-brand-200 dark:border-brand-700 flex flex-wrap gap-2 justify-between items-center bg-white dark:bg-brand-800 z-10 shadow-sm">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar flex-1">
            <h2 className="text-xl font-bold text-brand-800 dark:text-brand-100 hidden sm:block mr-2">球員管理</h2>
            
            <div className="flex bg-brand-100 dark:bg-brand-700 rounded-lg p-1 shrink-0">
               {(['games', 'name', 'gender', 'level'] as const).map((s) => (
                 <button
                   key={s}
                   onClick={() => setSortBy(s)}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                       sortBy === s 
                       ? 'bg-white dark:bg-brand-600 shadow text-brand-700 dark:text-brand-100' 
                       : 'text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-200'
                   }`}
                 >
                   {s === 'games' ? '場次' : s === 'name' ? '姓名' : s === 'gender' ? '性別' : '程度'}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex space-x-2 shrink-0">
             <Button variant="secondary" className="md:hidden" onClick={() => setIsPrepOpen(!isPrepOpen)}>
                 <List className="w-4 h-4" />
                 {prepCount > 0 && <span className="ml-1 bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-brand-300 text-[10px] px-1.5 rounded-full">{prepCount}</span>}
             </Button>

             <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-5 h-5" />
             </Button>

            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">新增</span>
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            
            {/* Recommended Section - Always show if enabled */}
            {enableRecommendation && (
                <>
                   <div className="col-span-full flex items-center space-x-2 mb-1 mt-1">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-500">推薦組合</span>
                        <div className="h-px bg-amber-200 dark:bg-amber-800 flex-1"></div>
                   </div>
                   
                   {recommendedPlayers.length > 0 ? (
                       recommendedPlayers.map(player => (
                          <PlayerCard 
                            key={player.id} 
                            player={player}
                            isSelected={selectedIds.includes(player.id!)}
                            isOnCourt={playersOnCourt.has(player.id!)}
                            isInPrep={playersInPrep.has(player.id!)}
                            isRecommended={true}
                            onClick={() => toggleSelection(player.id!)}
                            onEdit={() => handleEditPlayer(player)}
                          />
                       ))
                   ) : (
                       <div className="col-span-full py-8 text-center border-2 border-dashed border-brand-200 dark:border-brand-700 rounded-lg bg-brand-50/50 dark:bg-brand-900/50">
                           <p className="text-sm text-brand-400 dark:text-brand-500 font-medium">
                             目前無可推薦的球員組合
                           </p>
                           <p className="text-xs text-brand-300 dark:text-brand-600 mt-1">
                             (所有球員皆在預備區，或總人數不足 4 人)
                           </p>
                       </div>
                   )}

                   <div className="col-span-full flex items-center space-x-2 mb-1 mt-4 opacity-70">
                        <span className="text-xs font-bold text-brand-400 dark:text-brand-600">其他球員</span>
                        <div className="h-px bg-brand-200 dark:bg-brand-700 flex-1"></div>
                   </div>
                </>
            )}

            {/* Other Players */}
            {otherPlayers.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player}
                isSelected={selectedIds.includes(player.id!)}
                isOnCourt={playersOnCourt.has(player.id!)}
                isInPrep={playersInPrep.has(player.id!)}
                onClick={() => toggleSelection(player.id!)}
                onEdit={() => handleEditPlayer(player)}
              />
            ))}
          </div>
        </div>

        {/* Selection / Action Bar (Sticky Bottom) */}
        <div className="border-t border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-800 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
          <div className="flex flex-col space-y-3">
             {/* Warnings Area */}
             {warnings.length > 0 && (
               <div className="flex flex-col space-y-1 mb-2 max-h-20 overflow-y-auto">
                 {warnings.map((w, idx) => (
                   <div key={idx} className={`text-xs flex items-center px-2 py-1 rounded ${
                       w.type === 'red' 
                       ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                       : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500'
                    }`}>
                      {w.type === 'red' ? <AlertCircle className="w-3 h-3 mr-1 shrink-0"/> : <AlertTriangle className="w-3 h-3 mr-1 shrink-0"/>}
                      <span className="truncate">{w.message}</span>
                   </div>
                 ))}
               </div>
             )}

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                  {/* Stats Count with Icons */}
                  <div className="flex items-center space-x-3 text-sm font-medium">
                    <div className="flex items-center text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full">
                        <User className="w-3.5 h-3.5 mr-1" />
                        <span>{selectionStats.male}</span>
                    </div>
                    <div className="flex items-center text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                        <User className="w-3.5 h-3.5 mr-1" />
                        <span>{selectionStats.female}</span>
                    </div>
                  </div>

                  {/* Delete Button (Contextual) */}
                  {selectedIds.length > 0 && (
                      <button 
                        onClick={deleteSelectedPlayers}
                        className="flex items-center text-xs text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 mt-1.5 transition-colors pl-1"
                      >
                          <Trash2 className="w-3 h-3 mr-1" />
                          刪除已選
                      </button>
                  )}
              </div>

              <Button 
                onClick={addToPrep} 
                disabled={selectedIds.length !== 4}
                className="w-40 shadow-lg shadow-brand-200 dark:shadow-none"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                加入預備區
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isPrepOpen && (
        <div className="absolute inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsPrepOpen(false)} />
      )}

      {/* Right: Prep Area (Drawer on Mobile, Sidebar on Desktop) */}
      <div className={`absolute inset-y-0 right-0 z-40 w-80 bg-white dark:bg-brand-800 transform transition-transform duration-300 md:relative md:translate-x-0 md:border-l md:border-brand-200 dark:md:border-brand-700 ${isPrepOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="md:hidden p-2 flex justify-end border-b border-brand-200 dark:border-brand-700">
                 <Button variant="ghost" size="sm" onClick={() => setIsPrepOpen(false)}>關閉</Button>
            </div>
            <PreparationArea />
        </div>
      </div>

      <AddPlayerModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        editingPlayer={editingPlayer}
      />

      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         onResetData={resetAllGames}
         enableRecommendation={enableRecommendation}
         onToggleRecommendation={handleToggleRecommendation}
      />
    </div>
  );
};
