import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, RotateCcw, Copy, Download, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Gender } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  enableRecommendation: boolean;
  onToggleRecommendation: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onResetData,
  enableRecommendation,
  onToggleRecommendation
}) => {
  const { theme, setTheme } = useTheme();
  const players = useLiveQuery(() => db.players.toArray(), []);
  
  const [exportText, setExportText] = useState('');
  const [showExport, setShowExport] = useState(false);

  if (!isOpen) return null;

  const generateExport = () => {
    if (!players) return;
    
    const males = players.filter(p => p.gender === Gender.MALE);
    const females = players.filter(p => p.gender === Gender.FEMALE);
    
    let text = '';
    
    if (males.length > 0) {
        text += '男\n';
        males.forEach(p => {
            text += `${p.name} ${p.level}${p.partner ? ' ' + p.partner : ''}\n`;
        });
    }
    
    if (females.length > 0) {
        if (text) text += '\n';
        text += '女\n';
        females.forEach(p => {
            text += `${p.name} ${p.level}${p.partner ? ' ' + p.partner : ''}\n`;
        });
    }
    
    setExportText(text);
    setShowExport(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    alert('已複製到剪貼簿！');
  };

  const downloadFile = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badminton_players_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-brand-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-brand-200 dark:border-brand-700 max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-brand-200 dark:border-brand-700 shrink-0">
          <h2 className="text-lg font-bold text-brand-800 dark:text-brand-100">系統設定</h2>
          <button onClick={onClose} className="text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          
          {/* Recommendation Settings */}
          <div>
            <label className="block text-sm font-medium text-brand-600 dark:text-brand-300 mb-2">
              智能排點
            </label>
            <div 
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                 enableRecommendation 
                 ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' 
                 : 'bg-white border-brand-200 dark:bg-brand-800 dark:border-brand-600'
              }`}
              onClick={() => onToggleRecommendation(!enableRecommendation)}
            >
              <div className="flex items-center space-x-3">
                 <div className={`p-2 rounded-full ${enableRecommendation ? 'bg-amber-100 text-amber-600' : 'bg-brand-100 text-brand-400'}`}>
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-brand-800 dark:text-brand-100">啟用推薦排點</h4>
                    <p className="text-[10px] text-brand-500 dark:text-brand-400">依據場次、程度與歷史紀錄自動推薦組合</p>
                 </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${enableRecommendation ? 'bg-amber-500' : 'bg-brand-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${enableRecommendation ? 'left-6' : 'left-1'}`}></div>
              </div>
            </div>
          </div>

          <hr className="border-brand-100 dark:border-brand-700" />

          {/* Theme Section */}
          <div>
            <label className="block text-sm font-medium text-brand-600 dark:text-brand-300 mb-2">
              外觀模式
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  theme === 'light' 
                    ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-700 dark:border-brand-300 dark:text-brand-100' 
                    : 'border-brand-200 dark:border-brand-600 text-brand-400 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-700'
                }`}
              >
                <Sun className="w-5 h-5 mb-1" />
                <span className="text-xs">淺色</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  theme === 'dark' 
                    ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-700 dark:border-brand-300 dark:text-brand-100' 
                    : 'border-brand-200 dark:border-brand-600 text-brand-400 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-700'
                }`}
              >
                <Moon className="w-5 h-5 mb-1" />
                <span className="text-xs">深色</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  theme === 'system' 
                    ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-700 dark:border-brand-300 dark:text-brand-100' 
                    : 'border-brand-200 dark:border-brand-600 text-brand-400 dark:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-700'
                }`}
              >
                <Monitor className="w-5 h-5 mb-1" />
                <span className="text-xs">系統</span>
              </button>
            </div>
          </div>

          <hr className="border-brand-100 dark:border-brand-700" />

          {/* Export Section */}
          <div>
            <button 
                onClick={() => !showExport ? generateExport() : setShowExport(false)}
                className="flex items-center justify-between w-full text-sm font-medium text-brand-600 dark:text-brand-300 mb-2 hover:text-brand-800 dark:hover:text-brand-100"
            >
                <span>匯出球員資料</span>
                {showExport ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {showExport && (
                <div className="bg-brand-50 dark:bg-brand-900 rounded-lg p-3 space-y-3 border border-brand-200 dark:border-brand-700 animate-in slide-in-from-top-2">
                    <textarea 
                        readOnly
                        value={exportText}
                        className="w-full h-40 text-xs font-mono p-2 rounded border border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-800 text-brand-800 dark:text-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <div className="flex space-x-2">
                        <Button size="sm" variant="secondary" onClick={copyToClipboard} className="flex-1">
                            <Copy className="w-4 h-4 mr-1" /> 複製
                        </Button>
                        <Button size="sm" onClick={downloadFile} className="flex-1">
                            <Download className="w-4 h-4 mr-1" /> 下載 TXT
                        </Button>
                    </div>
                </div>
            )}
          </div>

          <hr className="border-brand-100 dark:border-brand-700" />

          {/* Data Section */}
          <div>
             <label className="block text-sm font-medium text-brand-600 dark:text-brand-300 mb-2">
              危險區域
            </label>
            <Button 
                variant="danger" 
                className="w-full justify-center"
                onClick={onResetData}
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                歸零場次並清除紀錄
            </Button>
            <p className="text-[10px] text-brand-400 dark:text-brand-500 mt-2 text-center">
                此動作將所有球員「Games」歸零，並<b>徹底刪除所有對戰歷史</b>。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};