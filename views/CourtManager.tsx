import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PreparationArea } from '../components/PreparationArea';
import { Matchup, Player } from '../types';
import { Button } from '../components/Button';
import { Plus, Minus, User, Timer, List } from 'lucide-react';

export const CourtManager: React.FC = () => {
  const courts = useLiveQuery(() => db.courts.toArray());
  const matchups = useLiveQuery(() => db.matchups.toArray());
  const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);
  const [isPrepOpen, setIsPrepOpen] = useState(false); // Mobile Drawer State

  const addCourt = async () => {
    const count = (courts?.length || 0) + 1;
    await db.courts.add({ name: `場地 ${count}`, players: [] });
  };

  const removeCourt = async (id: number) => {
    const court = courts?.find(c => c.id === id);
    if (court && court.players.length > 0) {
      alert('該場地正在使用中，無法刪除！');
      return;
    }
    await db.courts.delete(id);
  };

  const assignMatchToCourt = async (courtId: number, specificMatchup?: Matchup) => {
    const matchupToAssign = specificMatchup || selectedMatchup;
    if (!matchupToAssign) return;

    // 1. Get players
    const players = await db.players.where('id').anyOf(matchupToAssign.playerIds).toArray();
    
    // 2. Transaction
    await (db as any).transaction('rw', db.courts, db.matchups, db.players, db.history, async () => {
      // Update court
      await db.courts.update(courtId, { players: players });
      
      // Remove from prep
      await db.matchups.delete(matchupToAssign.id!);

      // Update games played count for players
      for (const p of players) {
        await db.players.update(p.id!, { gamesPlayed: p.gamesPlayed + 1 });
      }
    });

    if (matchupToAssign.id === selectedMatchup?.id) {
        setSelectedMatchup(null);
    }
  };

  const endGame = async (courtId: number, currentPlayers: Player[]) => {
    if (currentPlayers.length === 0) return;

    await (db as any).transaction('rw', db.courts, db.history, async () => {
      // Add to history
      await db.history.add({
        playerIds: currentPlayers.map(p => p.id!),
        timestamp: Date.now()
      });
      
      // Clear court
      await db.courts.update(courtId, { players: [] });
    });
  };

  const handleMatchupSelect = (matchup: Matchup) => {
    // Check if there is an empty court
    const emptyCourt = courts?.find(c => c.players.length === 0);
    
    if (emptyCourt) {
        assignMatchToCourt(emptyCourt.id!, matchup);
        setIsPrepOpen(false); // Close drawer if mobile
    } else {
        setSelectedMatchup(matchup);
        setIsPrepOpen(false); // Close drawer on selection for better UX
    }
  };

  const prepCount = matchups?.length || 0;

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Main: Courts */}
      <div className="flex-1 bg-brand-50 dark:bg-brand-900 flex flex-col overflow-hidden transition-colors">
        <div className="p-4 bg-white dark:bg-brand-800 border-b border-brand-200 dark:border-brand-700 flex justify-between items-center shadow-sm z-10">
          <h2 className="text-xl font-bold text-brand-800 dark:text-brand-100">場地管理</h2>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" className="md:hidden" onClick={() => setIsPrepOpen(!isPrepOpen)}>
                <List className="w-4 h-4" />
                {prepCount > 0 && <span className="ml-1 bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-brand-300 text-[10px] px-1.5 rounded-full">{prepCount}</span>}
            </Button>
            <div className="h-6 w-px bg-brand-200 dark:bg-brand-700 mx-2 hidden md:block"></div>
            <Button variant="secondary" size="sm" onClick={() => courts && courts.length > 0 && removeCourt(courts[courts.length - 1].id!)}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-mono font-bold text-lg w-8 text-center text-brand-700 dark:text-brand-200">{courts?.length || 0}</span>
            <Button variant="secondary" size="sm" onClick={addCourt}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {courts?.map(court => {
              const isEmpty = court.players.length === 0;
              return (
                <div 
                  key={court.id} 
                  className={`relative rounded-xl border-2 transition-all overflow-hidden flex flex-col ${
                    isEmpty 
                      ? (selectedMatchup 
                          ? 'border-brand-400 bg-brand-100 dark:border-brand-400 dark:bg-brand-800 ring-4 ring-brand-200 dark:ring-brand-700 cursor-pointer hover:bg-brand-200 dark:hover:bg-brand-700' 
                          : 'border-brand-300 bg-white dark:border-brand-700 dark:bg-brand-800/50') 
                      : 'border-green-500 bg-white dark:bg-brand-800 shadow-md'
                  }`}
                  onClick={() => isEmpty && selectedMatchup && assignMatchToCourt(court.id!)}
                >
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${
                      isEmpty 
                      ? 'border-brand-200 dark:border-brand-700' 
                      : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
                    }`}>
                    <span className="font-bold text-brand-700 dark:text-brand-200">{court.name}</span>
                    {!isEmpty && (
                        <div className="flex items-center text-green-700 dark:text-green-400 text-xs font-bold animate-pulse">
                            <Timer className="w-3 h-3 mr-1" /> Playing
                        </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex-1 min-h-[160px] flex flex-col justify-center">
                    {isEmpty ? (
                      <div className="text-center text-brand-400 dark:text-brand-600">
                        {selectedMatchup ? (
                          <span className="text-brand-600 dark:text-brand-300 font-bold flex flex-col items-center animate-bounce">
                             <Plus className="w-8 h-8 mb-2" />
                             點擊分配場地
                          </span>
                        ) : (
                          "空場地"
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {court.players.map(p => (
                          <div key={p.id} className="flex items-center space-x-2 bg-brand-50 dark:bg-brand-900/50 p-2 rounded border border-brand-100 dark:border-brand-700">
                            <User className="w-4 h-4 text-brand-400 dark:text-brand-500" />
                            <span className="text-sm font-medium text-brand-800 dark:text-brand-200 truncate">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isEmpty && (
                    <div className="p-3 bg-brand-50 dark:bg-brand-900/30 border-t border-brand-100 dark:border-brand-700">
                      <Button 
                        variant="secondary" 
                        className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
                        onClick={(e) => { e.stopPropagation(); endGame(court.id!, court.players); }}
                      >
                        結束比賽
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
            <PreparationArea 
                onSelectMatchup={handleMatchupSelect}
                selectedMatchupId={selectedMatchup?.id}
            />
        </div>
      </div>
      
      {/* Mobile Floating Action Indicator if Matchup is Selected but Drawer is closed */}
       {selectedMatchup && !isPrepOpen && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 bg-brand-500 text-white p-3 rounded-lg shadow-xl text-center z-50 animate-bounce cursor-pointer flex items-center justify-between" onClick={() => setSelectedMatchup(null)}>
           <span className="text-sm font-bold">已選 1 組，請點擊空場地</span>
           <span className="text-xs bg-brand-600 px-2 py-1 rounded">取消</span>
        </div>
      )}
    </div>
  );
};