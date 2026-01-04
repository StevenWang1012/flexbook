import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Member, YogaClass, AttendanceRecord, ClassTemplate } from '../types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface StoreContextType {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  classes: YogaClass[];
  setClasses: React.Dispatch<React.SetStateAction<YogaClass[]>>;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  templates: ClassTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ClassTemplate[]>>;
  syncStatus: SyncStatus;
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>;
  // 🟢 修改：允許傳入臨時網址與密碼進行測試
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: (isSilent?: boolean, overrideUrl?: string, overrideSecret?: string) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error(`Failed to load ${key}`, e);
    return defaultValue;
  }
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('zenflow_members', []));
  const [classes, setClasses] = useState<YogaClass[]>(() => loadFromStorage('zenflow_classes', []));
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadFromStorage('zenflow_records', []));
  const [templates, setTemplates] = useState<ClassTemplate[]>(() => loadFromStorage('zenflow_class_templates', []));
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const isFirstRender = useRef(true);

  // 本地持久化
  useEffect(() => { localStorage.setItem('zenflow_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('zenflow_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('zenflow_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('zenflow_class_templates', JSON.stringify(templates)); }, [templates]);

  const getApiConfig = () => {
    const dynamicUrl = (localStorage.getItem('zenflow_gas_url') || "").trim();
    const secret = (localStorage.getItem('zenflow_gas_secret') || "").trim();
    return { url: dynamicUrl, secret };
  };

  const syncToCloud = async (): Promise<boolean> => {
    const { url, secret } = getApiConfig();
    
    // 自動存檔時，如果沒有設定好，就靜默失敗，不要噴錯
    if (!url || !secret) return false;
    
    setSyncStatus('syncing');
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'push', 
          secret: secret,
          data: { members, classes, records, templates } 
        })
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
      return true;
    } catch (err) {
      console.error("Push Error:", err);
      setSyncStatus('error');
      return false;
    }
  };

  // 🟢 核心修改：優先使用傳入的參數 (override)，如果沒有才讀取設定
  const syncFromCloud = async (isSilent = false, overrideUrl?: string, overrideSecret?: string): Promise<boolean> => {
    const config = getApiConfig();
    const url = overrideUrl || config.url;
    const secret = overrideSecret || config.secret;

    if (!url || !secret) {
      if (!isSilent) alert("請輸入網址與密碼");
      return false;
    }

    if (!isSilent) setSyncStatus('syncing');
    try {
      const response = await fetch(`${url}?action=pull&secret=${encodeURIComponent(secret)}`);
      
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        throw new Error("格式錯誤：請確認 GAS 權限已設為「所有人 (Anyone)」");
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const { members: m, classes: c, records: r, templates: t } = result.data;
        if (m) setMembers(m);
        if (c) setClasses(c);
        if (r) setRecords(r);
        if (t) setTemplates(t);
        setSyncStatus('success');
        if (!isSilent) alert('✅ 連線成功！資料已同步。');
        setTimeout(() => setSyncStatus('idle'), 2000);
        return true;
      } else {
        setSyncStatus('error');
        if (!isSilent) alert('❌ 失敗: ' + (result.message || '密碼錯誤'));
        return false;
      }
    } catch (err) {
      console.error("Pull Error:", err);
      setSyncStatus('error');
      if (!isSilent) alert('❌ 連線失敗 (請檢查網址)');
      return false;
    }
  };

  // 自動存檔邏輯 (僅在已有設定時運作)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const { url, secret } = getApiConfig();
    if (!url || !secret) return;

    const timer = setTimeout(() => {
      syncToCloud();
    }, 2000); // 2秒後自動上傳

    return () => clearTimeout(timer);
  }, [members, classes, records, templates]);

  return (
    <StoreContext.Provider value={{
      members, setMembers,
      classes, setClasses,
      records, setRecords,
      templates, setTemplates,
      syncStatus, setSyncStatus,
      syncToCloud, syncFromCloud
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};