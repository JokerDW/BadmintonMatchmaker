import React, { useState } from 'react';
import { PlayerManager } from './views/PlayerManager';
import { CourtManager } from './views/CourtManager';
import { Users, Grid } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'courts'>('players');

  return (
    <div className="flex flex-col h-screen w-full bg-brand-50 dark:bg-brand-900 transition-colors">
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'players' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <PlayerManager />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'courts' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
           <CourtManager />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-white dark:bg-brand-800 border-t border-brand-200 dark:border-brand-700 flex items-center justify-around shrink-0 z-50 pb-safe transition-colors">
        <button 
          onClick={() => setActiveTab('players')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === 'players' 
              ? 'text-brand-600 dark:text-brand-300' 
              : 'text-brand-400 dark:text-brand-600 hover:text-brand-500 dark:hover:text-brand-400'
          }`}
        >
          <Users className="w-6 h-6" />
          <span className="text-xs font-medium">球員管理</span>
        </button>
        <button 
          onClick={() => setActiveTab('courts')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === 'courts' 
              ? 'text-brand-600 dark:text-brand-300' 
              : 'text-brand-400 dark:text-brand-600 hover:text-brand-500 dark:hover:text-brand-400'
          }`}
        >
          <Grid className="w-6 h-6" />
          <span className="text-xs font-medium">場地管理</span>
        </button>
      </nav>
    </div>
  );
};

export default App;