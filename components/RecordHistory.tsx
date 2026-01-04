
import React from 'react';
import { AttendanceRecord, YogaClass, Member } from '../types';

interface RecordHistoryProps {
  records: AttendanceRecord[];
  classes: YogaClass[];
  members: Member[];
}

const RecordHistory: React.FC<RecordHistoryProps> = ({ records, classes, members }) => {
  const sortedRecords = [...records].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">使用紀錄</h2>
      
      <div className="space-y-3">
        {sortedRecords.map(record => {
          const yogaClass = classes.find(c => c.id === record.classId);
          const member = members.find(m => m.id === record.memberId);
          const date = new Date(record.timestamp);

          return (
            <div key={record.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">{member?.name || '未知會員'}</h4>
                    <p className="text-xs text-slate-500">{yogaClass?.title || '未知課程'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-medium">
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block">扣卡 1 次</span>
                </div>
              </div>
            </div>
          );
        })}
        {sortedRecords.length === 0 && (
          <div className="text-center py-20 text-slate-400">目前尚無點名紀錄</div>
        )}
      </div>
    </div>
  );
};

export default RecordHistory;
