import React, { useState } from 'react';
import { Member, YogaClass, AttendanceRecord } from '../types';

interface DashboardProps {
  members: Member[];
  classes: YogaClass[];
  records: AttendanceRecord[];
  setClasses: React.Dispatch<React.SetStateAction<YogaClass[]>>;
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ members, classes, records, setClasses, setRecords, setMembers }) => {
  const [quickClass, setQuickClass] = useState<YogaClass | null>(null);
  
  // 🟢 工具：時間格式化 (相容 HH:mm 與 ISO 格式)
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    // 如果是 ISO 格式 (Google Sheet 傳回來的)，轉為 HH:mm
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // 嘗試修復可能出現的秒數 (19:00:00 -> 19:00)
    if (timeStr.split(':').length === 3) {
      return timeStr.substring(0, 5);
    }
    return timeStr;
  };
  
  // 🟢 工具：日期標準化 (只取 YYYY-MM-DD，處理 Google Sheet 回傳的 ISO 格式)
  const normalizeDate = (d: string) => d.includes('T') ? d.split('T')[0] : d;
  
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 🟢 修正：篩選時先將日期格式標準化，避免因為時區或格式不同導致找不到今日課程
  const todayClasses = classes.filter(c => normalizeDate(c.date) === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const upcomingClasses = classes.filter(c => normalizeDate(c.date) > todayStr).sort((a, b) => a.date.localeCompare(b.date));
  
  const activeMembersCount = members.length;
  const recentRecordsCount = records.filter(r => {
    const d = new Date(r.timestamp);
    const now = new Date();
    return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const markAttendance = (classId: string, memberId: string) => {
    const now = new Date().toISOString();
    const recordId = `r-${Date.now()}`;
    
    // Create record
    const newRecord: AttendanceRecord = {
      id: recordId,
      classId,
      memberId,
      timestamp: now,
      status: 'present'
    };

    setRecords(prev => [...prev, newRecord]);

    // Update class attendees
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, attendees: Array.from(new Set([...c.attendees, memberId])) } : c
    ));

    // Deduct remaining class from member
    setMembers(prev => prev.map(m => {
      if (m.id === memberId && m.remainingClasses > 0) {
        return { ...m, remainingClasses: m.remainingClasses - 1 };
      }
      return m;
    }));

    // Update local state for modal if open
    if (quickClass && quickClass.id === classId) {
      setQuickClass(prev => prev ? { ...prev, attendees: Array.from(new Set([...prev.attendees, memberId])) } : null);
    }
  };

  const removeAttendance = (classId: string, memberId: string) => {
    setRecords(prev => prev.filter(r => !(r.classId === classId && r.memberId === memberId)));
    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, attendees: c.attendees.filter(id => id !== memberId) } : c
    ));
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, remainingClasses: m.remainingClasses + 1 };
      }
      return m;
    }));

    // Update local state for modal if open
    if (quickClass && quickClass.id === classId) {
      setQuickClass(prev => prev ? { ...prev, attendees: prev.attendees.filter(id => id !== memberId) } : null);
    }
  };

  // Sort members for the quick attendance list: attendees first
  const sortedMembersForAttendance = quickClass 
    ? [...members].sort((a, b) => {
        const aIsPresent = quickClass.attendees.includes(a.id);
        const bIsPresent = quickClass.attendees.includes(b.id);
        if (aIsPresent === bIsPresent) return 0;
        return aIsPresent ? -1 : 1;
      })
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Card */}
      <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100 text-sm mb-1 opacity-90">歡迎回來，老師</p>
          <h2 className="text-2xl font-bold mb-4">今天有 {todayClasses.length} 堂課程</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <p className="text-xs text-emerald-100 uppercase tracking-wider mb-1">活躍會員</p>
              <p className="text-xl font-bold">{activeMembersCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <p className="text-xs text-emerald-100 uppercase tracking-wider mb-1">本週出席</p>
              <p className="text-xl font-bold">{recentRecordsCount}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Today's Classes - Quick Access */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            今日課程 
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">TODAY</span>
          </h3>
        </div>
        
        {todayClasses.length > 0 ? (
          <div className="space-y-3">
            {todayClasses.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-700">{c.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       {/* 🟢 套用格式化 */}
                       {formatTime(c.time)}
                    </span>
                    <span>•</span>
                    <span>{c.location}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setQuickClass(c)}
                  className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-xl font-bold active:scale-95 transition-all shadow-sm shadow-emerald-100"
                >
                  快速點名
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-dashed border-slate-200 text-center text-slate-400">
            今天尚無課程安排
          </div>
        )}
      </section>

      {/* Upcoming Classes */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">後續課程</h3>
        </div>
        
        {upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.slice(0, 3).map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-700">{c.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       {/* 🟢 套用格式化 */}
                       {normalizeDate(c.date)}
                    </span>
                    <span>•</span>
                    <span>{formatTime(c.time)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full font-medium border border-slate-100">
                    預約 {c.attendees.length} 人
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">暫無更多課程預約</div>
        )}
      </section>

      <section className="bg-white rounded-2xl p-5 border border-slate-100">
        <h3 className="text-md font-bold text-slate-800 mb-3">經營小幫手</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {todayClasses.length > 0 
            ? `今天共有 ${todayClasses.length} 堂課，預計服務 ${todayClasses.reduce((acc, c) => acc + c.attendees.length, 0)} 位會員。記得在課前確認教室通風狀況！`
            : "今天暫無課程，是個適合整理教學筆記或規劃下週課表的好時機。"}
        </p>
      </section>

      {/* Quick Attendance Modal */}
      {quickClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slideUp max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{quickClass.title} - 快速點名</h3>
                <p className="text-xs text-slate-500">{formatTime(quickClass.time)} @ {quickClass.location}</p>
              </div>
              <button onClick={() => setQuickClass(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 pb-4 flex-1">
              {sortedMembersForAttendance.map(member => {
                const isPresent = quickClass.attendees.includes(member.id);
                return (
                  <div key={member.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPresent ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isPresent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {member.name[0]}
                        </div>
                        {isPresent && (
                          <div className="absolute -right-1 -bottom-1 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-white">
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700 text-sm">{member.name}</p>
                          {isPresent && <span className="text-[9px] bg-emerald-600 text-white px-1 py-0.5 rounded font-bold uppercase tracking-widest">已簽到</span>}
                        </div>
                        <p className="text-[10px] text-slate-500">剩餘: {member.remainingClasses} 堂</p>
                      </div>
                    </div>
                    {isPresent ? (
                      <button 
                        onClick={() => removeAttendance(quickClass.id, member.id)}
                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 active:bg-red-100"
                      >
                        撤銷
                      </button>
                    ) : (
                      <button 
                        disabled={member.remainingClasses <= 0}
                        onClick={() => markAttendance(quickClass.id, member.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${member.remainingClasses > 0 ? 'bg-emerald-600 text-white shadow-sm active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        {member.remainingClasses > 0 ? '點名扣卡' : '點數不足'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={() => setQuickClass(null)}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold mt-4 active:bg-slate-900 shadow-lg"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;