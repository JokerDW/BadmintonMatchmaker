import React from 'react';
import { X, Moon, Sun, Monitor, RotateCcw, Save } from 'lucide-react';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onResetData }) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-brand-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col border border-brand-200 dark:border-brand-700 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-brand-200 dark:border-brand-700">
          <h2 className="text-lg font-bold text-brand-800 dark:text-brand-100">系統設定</h2>
          <button onClick={onClose} className="text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          
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

          {/* Data Section */}
          <div>
             <label className="block text-sm font-medium text-brand-600 dark:text-brand-300 mb-2">
              資料管理
            </label>
            <Button 
                variant="danger" 
                className="w-full justify-center"
                onClick={onResetData}
            >
                <RotateCcw className="w-4 h-4 mr-2" />
                歸零所有球員場次
            </Button>
            <p className="text-[10px] text-brand-400 dark:text-brand-500 mt-2 text-center">
                此動作將把所有球員的「Games」計數重設為 0，但不會刪除球員。
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};