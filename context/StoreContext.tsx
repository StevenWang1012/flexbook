import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member, YogaClass, AttendanceRecord } from '../types';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface StoreContextType {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  classes: YogaClass[];
  setClasses: React.Dispatch<React.SetStateAction<YogaClass[]>>;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  syncStatus: SyncStatus;
  setSyncStatus: React.Dispatch<React.SetStateAction<SyncStatus>>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// 🟢 輔助函式：從 localStorage 讀取資料，若無則回傳預設值
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
  // 🟢 修正：初始化時優先從 localStorage 讀取，避免重新整理後資料消失
  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('zenflow_members', []));
  const [classes, setClasses] = useState<YogaClass[]>(() => loadFromStorage('zenflow_classes', []));
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadFromStorage('zenflow_records', []));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // 🟢 新增：監聽資料變更，自動寫入 localStorage (本地備份)
  useEffect(() => {
    localStorage.setItem('zenflow_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('zenflow_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('zenflow_records', JSON.stringify(records));
  }, [records]);

  return (
    <StoreContext.Provider value={{
      members, setMembers,
      classes, setClasses,
      records, setRecords,
      syncStatus, setSyncStatus
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