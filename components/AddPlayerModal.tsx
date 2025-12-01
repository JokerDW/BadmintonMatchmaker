import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Gender } from '../types';
import { Button } from './Button';
import { X, Upload, Save, User } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'manual' | 'batch'>('manual');
  
  // Manual State
  const [manualName, setManualName] = useState('');
  const [manualLevel, setManualLevel] = useState('10');
  const [manualGender, setManualGender] = useState<Gender>(Gender.MALE);
  const [manualPartner, setManualPartner] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Batch State
  const [batchText, setBatchText] = useState('');

  // Fetch existing players for partner selection
  const existingPlayers = useLiveQuery(() => db.players.orderBy('name').toArray(), []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && mode === 'manual') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName) return;

    await db.players.add({
      name: manualName,
      level: parseInt(manualLevel) || 10,
      gender: manualGender,
      partner: manualPartner || undefined,
      gamesPlayed: 0
    });
    
    // Reset form fields
    setManualName('');
    setManualLevel('10');
    setManualPartner('');
    setManualGender(Gender.MALE);
    
    // Keep modal open and focus back on name input
    nameInputRef.current?.focus();
  };

  const handleBatchSubmit = async () => {
    if (!batchText) return;

    const lines = batchText.split('\n').map(l => l.trim()).filter(l => l);
    let currentGender: Gender = Gender.MALE;

    const playersToAdd: any[] = [];

    for (const line of lines) {
      if (line === '男') {
        currentGender = Gender.MALE;
        continue;
      }
      if (line === '女') {
        currentGender = Gender.FEMALE;
        continue;
      }

      // Format: Name Level [Partner]
      const parts = line.split(/\s+/); // Split by whitespace
      if (parts.length >= 2) {
        const name = parts[0];
        const level = parseInt(parts[1]);
        const partner = parts.length > 2 ? parts[2] : undefined;

        if (name && !isNaN(level)) {
            playersToAdd.push({
                name,
                level,
                gender: currentGender,
                partner,
                gamesPlayed: 0
            });
        }
      }
    }

    if (playersToAdd.length > 0) {
      await db.players.bulkAdd(playersToAdd);
      setBatchText('');
      onClose();
    }
  };

  const inputClass = "w-full rounded-md border-brand-300 dark:border-brand-600 bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-100 border px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500 dark:focus:ring-brand-300 dark:focus:border-brand-300";
  const labelClass = "block text-sm font-medium text-brand-700 dark:text-brand-300 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-brand-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-brand-200 dark:border-brand-700">
        <div className="flex justify-between items-center p-4 border-b border-brand-200 dark:border-brand-700">
          <h2 className="text-xl font-bold text-brand-800 dark:text-brand-100">新增球員</h2>
          <button onClick={onClose} className="text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex border-b border-brand-200 dark:border-brand-700">
          <button 
            className={`flex-1 py-3 font-medium text-sm transition-colors ${
                mode === 'manual' 
                ? 'text-brand-600 dark:text-brand-300 border-b-2 border-brand-500 dark:border-brand-300 bg-brand-50 dark:bg-brand-700/50' 
                : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            onClick={() => setMode('manual')}
          >
            手動輸入
          </button>
          <button 
            className={`flex-1 py-3 font-medium text-sm transition-colors ${
                mode === 'batch' 
                ? 'text-brand-600 dark:text-brand-300 border-b-2 border-brand-500 dark:border-brand-300 bg-brand-50 dark:bg-brand-700/50' 
                : 'text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-700'
            }`}
            onClick={() => setMode('batch')}
          >
            批次匯入
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {mode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>稱呼</label>
                <input 
                  ref={nameInputRef}
                  required
                  type="text" 
                  value={manualName} 
                  onChange={e => setManualName(e.target.value)}
                  className={inputClass}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                   <label className={labelClass}>程度 (1-20)</label>
                   <input 
                    type="number" 
                    min="1" max="20"
                    value={manualLevel}
                    onChange={e => setManualLevel(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                   <label className={labelClass}>性別</label>
                   <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setManualGender(Gender.MALE)}
                        className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                          manualGender === Gender.MALE 
                            ? 'bg-sky-50 dark:bg-sky-900/30 border-sky-500 text-sky-600 dark:text-sky-400' 
                            : 'border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-700'
                        }`}
                      >
                        男
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualGender(Gender.FEMALE)}
                        className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                          manualGender === Gender.FEMALE 
                            ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-600 dark:text-rose-400' 
                            : 'border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-700'
                        }`}
                      >
                        女
                      </button>
                   </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>搭檔 (選填)</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-brand-400 pointer-events-none" />
                  <select 
                    value={manualPartner} 
                    onChange={e => setManualPartner(e.target.value)}
                    className={`${inputClass} pl-9 appearance-none`}
                  >
                    <option value="">-- 選擇已有球員 --</option>
                    {existingPlayers?.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} (Lv.{p.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4">
                <Save className="w-4 h-4 mr-2" /> 儲存 (Enter)
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
               <div className="bg-brand-50 dark:bg-brand-900 p-3 rounded-md text-xs text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-700">
                  <p className="font-bold mb-1">格式說明：</p>
                  <pre className="whitespace-pre-wrap font-mono">
男
球員A 10
球員B 11

女
球員C 9 球員A
球員D 8
                  </pre>
               </div>
               <textarea 
                value={batchText}
                onChange={e => setBatchText(e.target.value)}
                placeholder="在此貼上資料..."
                className={`${inputClass} h-40 font-mono`}
               />
               <Button onClick={handleBatchSubmit} className="w-full">
                 <Upload className="w-4 h-4 mr-2" /> 匯入
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};