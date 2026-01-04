import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { View } from './types';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import MemberManager from './components/MemberManager';
import RecordHistory from './components/RecordHistory';
import Navigation from './components/Navigation';
import Settings from './components/Settings';
import { useStore } from './context/StoreContext';

// 建立一個內部組件來使用 useStore (必須在 StoreProvider 內)
const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  // 🟢 修正：從 Store 取出所有資料與設定函式
  const { 
    members, setMembers, 
    classes, setClasses, 
    records, setRecords, 
    syncStatus 
  } = useStore();

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        // 🟢 修正：將資料透過 props 傳入 Dashboard，避免 undefined 錯誤
        return (
          <Dashboard 
            members={members} 
            classes={classes} 
            records={records}
            setMembers={setMembers}
            setClasses={setClasses}
            setRecords={setRecords}
          />
        );
      case View.CLASSES:
        return (
          <ClassManager 
            classes={classes}
            setClasses={setClasses}
            members={members}
            setMembers={setMembers}
            setRecords={setRecords}
            records={records}
          />
        );
      case View.MEMBERS:
        return (
          <MemberManager 
            members={members}
            setMembers={setMembers}
          />
        );
      case View.RECORDS:
        return (
          <RecordHistory 
            records={records}
            classes={classes}
            members={members}
          />
        );
      case View.SETTINGS:
        return (
          <Settings 
            members={members}
            classes={classes}
            records={records}
            setMembers={setMembers}
            setClasses={setClasses}
            setRecords={setRecords}
          />
        );
      default:
        return (
          <Dashboard 
            members={members} 
            classes={classes} 
            records={records}
            setMembers={setMembers}
            setClasses={setClasses}
            setRecords={setRecords}
          />
        );
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'syncing': return <span className="flex items-center gap-1 text-blue-500 animate-pulse"><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span className="text-[10px]">同步中</span></span>;
      case 'success': return <span className="flex items-center gap-1 text-emerald-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span className="text-[10px]">已連動</span></span>;
      case 'error': return <span className="flex items-center gap-1 text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg><span className="text-[10px]">連線錯誤</span></span>;
      case 'idle': return <span className="flex items-center gap-1 text-slate-300"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg><span className="text-[10px]">雲端就緒</span></span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      <header className="bg-white border-b px-4 py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center h-16">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-emerald-700 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            ZenFlow
          </h1>
          {getSyncIcon()}
        </div>
        <div className="text-[10px] text-slate-400 font-medium text-right leading-tight">
          零成本管理方案<br/>{new Date().toLocaleDateString()}
        </div>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto p-4">
        {renderView()}
      </main>
      <Navigation currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainContent />
    </StoreProvider>
  );
};

export default App;