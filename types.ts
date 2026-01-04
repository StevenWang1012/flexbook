export enum View {
  DASHBOARD = 'DASHBOARD',
  CLASSES = 'CLASSES',
  MEMBERS = 'MEMBERS',
  RECORDS = 'RECORDS',
  SETTINGS = 'SETTINGS'
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  packageType: 'single' | 'package_10' | 'monthly' | 'unlimited';
  remainingClasses: number;
  totalPurchasedClasses: number;
  joinDate: string;
  note?: string;
}

export interface YogaClass {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  maxCapacity: number;
  attendees: string[];
  instructor: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  memberId: string;
  timestamp: string;
  status: 'present' | 'absent' | 'late';
}

export interface ClassTemplate {
  id: string;
  name: string;
  defaultLocation?: string;
  defaultCapacity?: number;
}