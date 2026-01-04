import React, { useState, useEffect } from 'react';
import { Member, YogaClass, AttendanceRecord } from '../types';

// 🟢 設定：若您會操作程式碼，可將網址貼在下方引號中 (介面輸入框會自動隱藏)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnOMmj0TFVeatfeZ9HFtLib7BzfSlP1fEbnlojY4_-KkFSUBtAyOsHOkWdypSQF62N/exec"; 
// 例如: "https://script.google.com/macros/s/AKfycbx.../exec"

interface SettingsProps {
  members: Member[];
  classes: YogaClass[];
  records: AttendanceRecord[];
  setMembers: (m: Member[]) => void;
  setClasses: (c: YogaClass[]) => void;
  setRecords: (r: AttendanceRecord[]) => void;
}

// 定義課程模板介面
interface ClassTemplate {
  id: string;
  name: string; // 課程名稱
  defaultLocation?: string; // 預設教室 (選填)
  defaultCapacity?: number; // 預設人數 (選填)
}

const Settings: React.FC<SettingsProps> = ({ members, classes, records, setMembers, setClasses, setRecords }) => {
  const [apiSecret, setApiSecret] = useState(localStorage.getItem('zenflow_gas_secret') || '');
  const [dynamicUrl, setDynamicUrl] = useState(localStorage.getItem('zenflow_gas_url') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 🟢 新增：驗證狀態 (false = 未驗證/更動過, true = 連線成功過)
  const [isVerified, setIsVerified] = useState(false);

  // 決定最終使用的網址
  const finalScriptUrl = GOOGLE_SCRIPT_URL || dynamicUrl;

  const [templates, setTemplates] = useState<ClassTemplate[]>(() => {
    const saved = localStorage.getItem('zenflow_class_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTemplateName, setNewTemplateName] = useState('');

  // 監聽密碼變更
  useEffect(() => {
    localStorage.setItem('zenflow_gas_secret', apiSecret);
    // 只有當真的有值且不是初始載入時才重置狀態，但這裡為了安全，只要變更就重置
    if (!isVerified) return; // 如果已經是 false 就不動作
    setIsVerified(false);
  }, [apiSecret]);

  // 監聽網址變更
  useEffect(() => {
    localStorage.setItem('zenflow_gas_url', dynamicUrl);
    if (!isVerified) return;
    setIsVerified(false);
  }, [dynamicUrl]);

  useEffect(() => {
    localStorage.setItem('zenflow_class_templates', JSON.stringify(templates));
  }, [templates]);

  const handleAddTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newTemplate: ClassTemplate = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      defaultCapacity: 10
    };
    setTemplates([...templates, newTemplate]);
    setNewTemplateName('');
  };

  const handleRemoveTemplate = (id: string) => {
    if (confirm('確定要刪除這個課程模板嗎？')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const syncToCloud = async () => {
    if (!finalScriptUrl) return alert('請先設定 Google Apps Script 網址 (請聯絡管理員或在下方輸入)');
    if (!apiSecret) return alert('請輸入通關密語以保護您的資料');
    
    setIsSyncing(true);
    try {
      await fetch(finalScriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'push', 
          secret: apiSecret,
          data: { 
            members, 
            classes, 
            records,
            templates
          } 
        })
      });
      // 🟢 成功後設為已驗證 (鎖定欄位)
      setIsVerified(true);
      alert('✅ 上傳成功！資料已同步至雲端試算表。');
    } catch (err) {
      setIsVerified(false);
      alert('❌ 上傳失敗：' + err);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromCloud = async () => {
    if (!finalScriptUrl) return alert('請先設定 Google Apps Script 網址 (請聯絡管理員或在下方輸入)');
    if (!apiSecret) return alert('請輸入通關密語');

    setIsSyncing(true);
    try {
      const response = await fetch(`${finalScriptUrl}?action=pull&secret=${encodeURIComponent(apiSecret)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const { members: m, classes: c, records: r, templates: t } = result.data;
        if (m) setMembers(m);
        if (c) setClasses(c);
        if (r) setRecords(r);
        if (t) setTemplates(t);
        
        // 🟢 成功後設為已驗證 (鎖定欄位)
        setIsVerified(true);
        alert('✅ 下載成功！資料已更新至最新狀態。');
      } else if (result.status === 'error') {
        setIsVerified(false);
        alert('❌ 驗證失敗：' + result.message + ' (請檢查密碼)');
      }
    } catch (err) {
      setIsVerified(false);
      alert('❌ 連線失敗，請檢查網路或聯絡管理員。');
    } finally {
      setIsSyncing(false);
    }
  };

  // 狀態判斷邏輯
  const getStatusConfig = () => {
    if (!apiSecret || !finalScriptUrl) {
      return { color: 'bg-red-400', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-800', label: '尚未完成設定', sub: '請輸入網址與通關密語' };
    }
    if (isVerified) {
      return { color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-800', label: '✅ 連線驗證成功', sub: '設定已鎖定，防止誤觸修改' };
    }
    return { color: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-800', label: '⚠️ 設定已輸入 (待驗證)', sub: '請試著按一次「下載」來確認密碼正確' };
  };

  const status = getStatusConfig();

  // 🟢 解鎖功能
  const handleUnlock = () => {
    if (confirm('確定要解鎖並修改連線設定嗎？\n\n注意：修改後需重新驗證連線。')) {
      setIsVerified(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <h2 className="text-xl font-bold text-slate-800">系統設定</h2>

      {/* 常用課程模板管理區塊 */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          常用課程模板設定
        </h3>
        <p className="text-xs text-slate-400">在此設定您的常態課程名稱，新增課程時即可直接選取。</p>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="輸入課程名稱 (例如: 週一哈達瑜珈)" 
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
          />
          <button 
            onClick={handleAddTemplate}
            disabled={!newTemplateName.trim()}
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
          >
            新增
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {templates.length > 0 ? templates.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-bold text-slate-700">{t.name}</span>
              <button 
                onClick={() => handleRemoveTemplate(t.id)}
                className="text-slate-400 hover:text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          )) : (
            <p className="text-xs text-slate-300 italic w-full text-center py-2">尚未設定任何模板</p>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        
        {/* 狀態顯示 */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${status.bg} ${status.border}`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.color} ${isVerified ? '' : 'animate-pulse'}`}></div>
            <div>
              <p className={`text-sm font-bold ${status.text}`}>
                {status.label}
              </p>
              <p className="text-xs opacity-70 mt-0.5 text-slate-600">
                {status.sub}
              </p>
            </div>
          </div>
          {/* 🟢 解鎖按鈕 */}
          {isVerified && (
            <button 
              onClick={handleUnlock}
              className="text-xs text-slate-500 underline hover:text-emerald-600 font-medium"
            >
              解除鎖定
            </button>
          )}
        </div>

        {/* 智慧輸入區：只有在沒有寫死 URL 時才顯示 */}
        {!GOOGLE_SCRIPT_URL && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">系統網址 (僅需輸入一次)</label>
            <div className="relative">
              <input 
                type="text" 
                value={dynamicUrl}
                onChange={(e) => setDynamicUrl(e.target.value)}
                disabled={isVerified} // 🟢 鎖定
                placeholder="https://script.google.com/..." 
                className={`w-full border rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${isVerified ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' : 'bg-white border-slate-200'}`}
              />
              {isVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 密碼輸入 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">通關密語 (Secret Token)</label>
          <div className="relative">
            <input 
              type="password" 
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              disabled={isVerified} // 🟢 鎖定
              placeholder="請輸入密碼..." 
              className={`w-full border rounded-xl px-4 py-4 text-lg font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all ${isVerified ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' : 'bg-white border-slate-200'}`}
            />
            {isVerified && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
            )}
          </div>
        </div>

        {/* 同步按鈕區 */}
        <div className="grid grid-cols-1 gap-4 pt-2">
          <button 
            onClick={syncToCloud}
            disabled={isSyncing || !apiSecret || !finalScriptUrl}
            className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 rounded-xl text-md font-bold shadow-md active:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            上傳備份 (Push)
            <span className="text-xs opacity-80 font-normal">手機 ➝ 雲端</span>
          </button>

          <button 
            onClick={syncFromCloud}
            disabled={isSyncing || !apiSecret || !finalScriptUrl}
            className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-xl text-md font-bold active:bg-slate-50 active:border-slate-300 transition-all disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path></svg>
            下載資料 (Pull)
            <span className="text-xs opacity-80 font-normal">雲端 ➝ 手機</span>
          </button>
        </div>

      </section>

      {/* 重置按鈕 (隱藏在最下方，防誤觸) */}
      <div className="pt-8 text-center">
        <button 
          onClick={() => {
            if(confirm('警告：這將清除手機上的所有資料並重新整理。\n\n確認要執行嗎？')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-xs text-slate-300 underline hover:text-red-300 transition-colors p-4"
        >
          重設應用程式
        </button>
        <p className="text-[10px] text-slate-300 mt-1">ZenFlow Lite</p>
      </div>
    </div>
  );
};

export default Settings;