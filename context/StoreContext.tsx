import React, { createContext, useContext, useState, ReactNode } from 'react';
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

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with empty arrays. Data will be loaded from local storage or cloud in the future/components.
  // Ideally we should move localStorage logic here, but following the plan to minimally invade Settings.tsx first.
  const [members, setMembers] = useState<Member[]>([]);
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

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
