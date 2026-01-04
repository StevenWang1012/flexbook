import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Member, YogaClass, AttendanceRecord, ClassTemplate } from '@/types';

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
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: (isSilent?: boolean) => Promise<boolean>;
  isAutoSaveEnabled: boolean;
  setIsAutoSaveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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
  
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => {
    return localStorage.getItem('zenflow_autosave') !== 'false';
  });

  const isFirstRender = useRef(true);

  useEffect(() => { localStorage.setItem('zenflow_members', JSON.stringify(members)); }, [members]);
  useEffect(() => { localStorage.setItem('zenflow_classes', JSON.stringify(classes)); }, [classes]);
  useEffect(() => { localStorage.setItem('zenflow_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('zenflow_class_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('zenflow_autosave', String(isAutoSaveEnabled)); }, [isAutoSaveEnabled]);

  const getApiConfig = () => {
    const STATIC_URL = ""; 
    const dynamicUrl = localStorage.getItem('zenflow_gas_url') || "";
    const url = STATIC_URL || dynamicUrl;
    const secret = localStorage.getItem('zenflow_gas_secret') || "";
    return { url, secret };
  };

  const syncToCloud = async (): Promise<boolean> => {
    const { url, secret } = getApiConfig();
    if (!url || !secret) {
      setSyncStatus('error');
      return false;
    }
    
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
      setTimeout(() => setSyncStatus('idle'), 3000);
      return true;
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      return false;
    }
  };

  const syncFromCloud = async (isSilent = false): Promise<boolean> => {
    const { url, secret } = getApiConfig();
    if (!url || !secret) return false;

    if (!isSilent) setSyncStatus('syncing');
    try {
      const response = await fetch(`${url}?action=pull&secret=${encodeURIComponent(secret)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const { members: m, classes: c, records: r, templates: t } = result.data;
        if (m) setMembers(m);
        if (c) setClasses(c);
        if (r) setRecords(r);
        if (t) setTemplates(t);
        setSyncStatus('success');
        if (!isSilent) alert('✅ 資料已同步至最新狀態');
        setTimeout(() => setSyncStatus('idle'), 3000);
        return true;
      } else {
        setSyncStatus('error');
        if (!isSilent) alert('❌ 同步失敗: ' + result.message);
        return false;
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      if (!isSilent) alert('❌ 連線失敗');
      return false;
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const { url, secret } = getApiConfig();
    if (!isAutoSaveEnabled || !url || !secret) return;

    const timer = setTimeout(() => {
      console.log('Auto-saving to cloud...');
      syncToCloud();
    }, 500);

    return () => clearTimeout(timer);
  }, [members, classes, records, templates]);

  return (
    <StoreContext.Provider value={{
      members, setMembers,
      classes, setClasses,
      records, setRecords,
      templates, setTemplates,
      syncStatus, setSyncStatus,
      syncToCloud, syncFromCloud,
      isAutoSaveEnabled, setIsAutoSaveEnabled
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