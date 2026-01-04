import React, { useState, useEffect } from 'react';
import { ClassTemplate } from '../types';
import { useStore } from '../context/StoreContext';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnOMmj0TFVeatfeZ9HFtLib7BzfSlP1fEbnlojY4_-KkFSUBtAyOsHOkWdypSQF62N/exec"; 

const Settings: React.FC = () => {
  const { 
    syncFromCloud, 
    syncStatus, 
    templates, 
    setTemplates
  } = useStore();

  // 這些 State 是暫存的，還沒寫入 LocalStorage
  const [apiSecret, setApiSecret] = useState(localStorage.getItem('zenflow_gas_secret') || '');
  const [dynamicUrl, setDynamicUrl] = useState(localStorage.getItem('zenflow_gas_url') || '');
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // 是否已驗證成功並鎖定
  const [isVerified, setIsVerified] = useState(false);

  // 初始化檢查：如果原本就有存好的設定，預設為已驗證
  useEffect(() => {
    const savedUrl = localStorage.getItem('zenflow_gas_url');
    const savedSecret = localStorage.getItem('zenflow_gas_secret');
    if (savedUrl && savedSecret) {
      // 這裡不自動設為 true，讓使用者還是可以看到狀態，但我們可以假設它已設定
    }
  }, []);

  const handleConnect = async () => {
    // 優先使用寫死的 URL，沒有才用輸入框的
    const urlToUse = GOOGLE_SCRIPT_URL || dynamicUrl;
    
    if (!urlToUse.trim()) return alert('請輸入系統網址');
    if (!apiSecret.trim()) return alert('請輸入通關密語');

    // 🟢 關鍵修改：直接把現在輸入框的值傳進去測試，不依賴 localStorage
    const success = await syncFromCloud(false, urlToUse, apiSecret);
    
    if (success) {
      // ✅ 測試成功了！這時候才把正確的設定存起來
      localStorage.setItem('zenflow_gas_url', urlToUse);
      localStorage.setItem('zenflow_gas_secret', apiSecret);
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  };

  const handleUnlock = () => {
    if (confirm('確定要解鎖並修改設定嗎？')) {
      setIsVerified(false);
    }
  };

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

  // 狀態顯示邏輯
  const isConfigured = !!((GOOGLE_SCRIPT_URL || dynamicUrl) && apiSecret);
  
  const getStatusDisplay = () => {
    if (syncStatus === 'syncing') return { color: 'bg-blue-500 animate-pulse', text: '正在連線...', sub: '資料同步中' };
    
    if (isVerified) return { color: 'bg-emerald-500', text: '✅ 已連線', sub: '自動存檔運作中' };
    
    if (!isConfigured) return { color: 'bg-slate-200', text: '等待輸入', sub: '請輸入資料庫連結資訊' };
    
    return { color: 'bg-amber-400', text: '待連線', sub: '請點擊下方按鈕進行驗證' };
  };

  const status = getStatusDisplay();

  return (
    <div className="space-y-6 pb-10">
      <h2 className="text-xl font-bold text-slate-800">系統設定</h2>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">{status.text}</p>
            <p className="text-xs text-slate-500">{status.sub}</p>
          </div>
          {isVerified && (
            <button onClick={handleUnlock} className="text-xs text-slate-400 underline">修改設定</button>
          )}
        </div>

        {!GOOGLE_SCRIPT_URL && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase">資料庫網址</label>
            <input 
              type="text" 
              value={dynamicUrl} 
              onChange={(e) => {
                setDynamicUrl(e.target.value);
                setIsVerified(false); // 修改時解鎖
              }} 
              disabled={isVerified}
              placeholder="https://script.google.com/..." 
              className={`w-full border rounded-xl px-4 py-3 text-xs ${isVerified ? 'bg-slate-100 text-slate-400' : 'bg-white'}`} 
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase">通關密語</label>
          <input 
            type="password" 
            value={apiSecret} 
            onChange={(e) => {
              setApiSecret(e.target.value);
              setIsVerified(false); // 修改時解鎖
            }} 
            disabled={isVerified}
            placeholder="請輸入密碼..." 
            className={`w-full border rounded-xl px-4 py-3 text-lg font-bold tracking-widest ${isVerified ? 'bg-slate-100 text-slate-400' : 'bg-white'}`} 
          />
        </div>

        {!isVerified && (
          <button 
            onClick={handleConnect} 
            disabled={!isConfigured || syncStatus === 'syncing'} 
            className="w-full bg-emerald-600 text-white py-4 rounded-xl text-md font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {syncStatus === 'syncing' ? '連線中...' : '連結資料庫'}
          </button>
        )}
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">常用課程模板</h3>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="例如: 週一哈達瑜珈" 
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
          />
          <button onClick={handleAddTemplate} disabled={!newTemplateName.trim()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50">新增</button>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-bold text-slate-700">{t.name}</span>
              <button onClick={() => handleRemoveTemplate(t.id)} className="text-slate-400 hover:text-red-500">×</button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-xs text-slate-300 italic">無模板</p>}
        </div>
      </section>

      <div className="pt-8 text-center">
        <button onClick={() => { if(confirm('警告：這將清除手機上的所有資料並重新整理。\n\n確認要執行嗎？')) { localStorage.clear(); window.location.reload(); } }} className="text-xs text-slate-300 underline hover:text-red-300">重設應用程式</button>
      </div>
    </div>
  );
};

export default Settings;