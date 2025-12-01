import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PlayerCard } from '../components/PlayerCard';
import { Button } from '../components/Button';
import { AddPlayerModal } from '../components/AddPlayerModal';
import { PreparationArea } from '../components/PreparationArea';
import { Plus, UserPlus, Trash2, AlertTriangle, AlertCircle, List, Moon, Sun, Monitor } from 'lucide-react';
import { getSelectionWarnings } from '../services/playerService';
import { useTheme } from '../contexts/ThemeContext';

export const PlayerManager: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrepOpen, setIsPrepOpen] = useState(false); // Mobile Prep Drawer State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'games' | 'name' | 'gender'>('games');
  
  // Theme
  const { theme, setTheme } = useTheme();

  // Warnings State
  const [warnings, setWarnings] = useState<{ type: 'yellow' | 'red'; message: string }[]>([]);

  // Fetch Data
  const allPlayers = useLiveQuery(() => db.players.toArray(), []);
  const courts = useLiveQuery(() => db.courts.toArray(), []);
  const matchups = useLiveQuery(() => db.matchups.toArray(), []);

  // Derived IDs
  const playersOnCourt = new Set<number>();
  courts?.forEach(c => c.players.forEach(p => playersOnCourt.add(p.id!)));
  
  const playersInPrep = new Set<number>();
  matchups?.forEach(m => m.playerIds.forEach(id => playersInPrep.add(id)));

  // Sorting
  const sortedPlayers = [...(allPlayers || [])].sort((a, b) => {
    if (sortBy === 'games') return a.gamesPlayed - b.gamesPlayed;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'gender') return a.gender.localeCompare(b.gender);
    return 0;
  });

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
  
  const cycleTheme = () => {
      if (theme === 'system') setTheme('light');
      else if (theme === 'light') setTheme('dark');
      else setTheme('system');
  }

  const prepCount = matchups?.length || 0;

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Left: Player List */}
      <div className="flex-1 flex flex-col min-w-0 bg-brand-50 dark:bg-brand-900 transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-brand-200 dark:border-brand-700 flex flex-wrap gap-2 justify-between items-center bg-white dark:bg-brand-800 z-10 shadow-sm">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
            <h2 className="text-xl font-bold text-brand-800 dark:text-brand-100 hidden sm:block">球員管理</h2>
            
            {/* Theme Toggle Button */}
            <button 
              onClick={cycleTheme}
              className="p-2 rounded-full hover:bg-brand-100 dark:hover:bg-brand-700 text-brand-600 dark:text-brand-300 transition-colors"
              title={`Current: ${theme}`}
            >
                {theme === 'light' && <Sun className="w-5 h-5" />}
                {theme === 'dark' && <Moon className="w-5 h-5" />}
                {theme === 'system' && <Monitor className="w-5 h-5" />}
            </button>

            <div className="flex bg-brand-100 dark:bg-brand-700 rounded-lg p-1 shrink-0">
               {(['games', 'name', 'gender'] as const).map((s) => (
                 <button
                   key={s}
                   onClick={() => setSortBy(s)}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                       sortBy === s 
                       ? 'bg-white dark:bg-brand-600 shadow text-brand-700 dark:text-brand-100' 
                       : 'text-brand-500 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-200'
                   }`}
                 >
                   {s === 'games' ? '場次' : s === 'name' ? '姓名' : '性別'}
                 </button>
               ))}
            </div>
          </div>
          <div className="flex space-x-2 shrink-0">
             <Button variant="secondary" className="md:hidden" onClick={() => setIsPrepOpen(!isPrepOpen)}>
                 <List className="w-4 h-4" />
                 {prepCount > 0 && <span className="ml-1 bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-brand-300 text-[10px] px-1.5 rounded-full">{prepCount}</span>}
             </Button>

             {selectedIds.length > 0 && (
                 <Button variant="danger" size="sm" onClick={deleteSelectedPlayers}>
                     <Trash2 className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">刪除</span>
                 </Button>
             )}
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">新增</span>
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortedPlayers.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player}
                isSelected={selectedIds.includes(player.id!)}
                isOnCourt={playersOnCourt.has(player.id!)}
                isInPrep={playersInPrep.has(player.id!)}
                onClick={() => toggleSelection(player.id!)}
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
              <div className="text-sm font-medium text-brand-600 dark:text-brand-300">
                已選擇 <span className="text-brand-800 dark:text-brand-100 font-bold text-lg">{selectedIds.length}</span> / 4
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
      <div className={`absolute inset-y-0 right-0 z-40 w-80 bg-white dark:bg-brand-800 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none md:border-l md:border-brand-200 dark:md:border-brand-700 ${isPrepOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
            <div className="md:hidden p-2 flex justify-end border-b border-brand-200 dark:border-brand-700">
                 <Button variant="ghost" size="sm" onClick={() => setIsPrepOpen(false)}>關閉</Button>
            </div>
            <PreparationArea />
        </div>
      </div>

      <AddPlayerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};