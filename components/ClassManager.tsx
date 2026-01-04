
import React, { useState } from 'react';
import { YogaClass, Member, AttendanceRecord } from '../types';

interface ClassManagerProps {
  classes: YogaClass[];
  setClasses: React.Dispatch<React.SetStateAction<YogaClass[]>>;
  members: Member[];
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const ClassManager: React.FC<ClassManagerProps> = ({ classes, setClasses, members, setRecords, setMembers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<YogaClass | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: '',
    maxCapacity: 10
  });

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: YogaClass = {
      id: Date.now().toString(),
      ...formData,
      attendees: [],
      instructor: 'Teacher',
      status: 'upcoming'
    };
    setClasses([...classes, newClass]);
    setShowAddForm(false);
    setFormData({ 
      title: '', 
      date: new Date().toISOString().split('T')[0], 
      time: '19:00', 
      location: '', 
      maxCapacity: 10 
    });
  };

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
    setClasses(prev => {
      const updated = prev.map(c => 
        c.id === classId ? { ...c, attendees: Array.from(new Set([...c.attendees, memberId])) } : c
      );
      // Keep selectedClass in sync if currently viewing
      if (selectedClass && selectedClass.id === classId) {
        setSelectedClass({ ...selectedClass, attendees: Array.from(new Set([...selectedClass.attendees, memberId])) });
      }
      return updated;
    });

    // Deduct remaining class from member
    setMembers(prev => prev.map(m => {
      if (m.id === memberId && m.remainingClasses > 0) {
        return { ...m, remainingClasses: m.remainingClasses - 1 };
      }
      return m;
    }));
  };

  const removeAttendance = (classId: string, memberId: string) => {
    setRecords(prev => prev.filter(r => !(r.classId === classId && r.memberId === memberId)));
    setClasses(prev => {
      const updated = prev.map(c => 
        c.id === classId ? { ...c, attendees: c.attendees.filter(id => id !== memberId) } : c
      );
      // Keep selectedClass in sync
      if (selectedClass && selectedClass.id === classId) {
        setSelectedClass({ ...selectedClass, attendees: selectedClass.attendees.filter(id => id !== memberId) });
      }
      return updated;
    });
    // Add back remaining class
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return { ...m, remainingClasses: m.remainingClasses + 1 };
      }
      return m;
    }));
  };

  // Sort members for detail view: attendees first
  const sortedMembersForAttendance = selectedClass 
    ? [...members].sort((a, b) => {
        const aIsPresent = selectedClass.attendees.includes(a.id);
        const bIsPresent = selectedClass.attendees.includes(b.id);
        if (aIsPresent === bIsPresent) return 0;
        return aIsPresent ? -1 : 1;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">課程管理</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          + 新增課程
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slideUp">
            <h3 className="text-lg font-bold mb-4">安排新課程</h3>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">課程名稱</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="例如：哈達瑜珈基礎" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">日期</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">時間</label>
                  <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">地點 / 教室</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="例如：教室 A" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">人數上限</label>
                  <input required type="number" min="1" value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 10})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="預設 10" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 text-slate-500 font-bold">取消</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">確認新增</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedClass ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-fadeIn">
          <button onClick={() => setSelectedClass(null)} className="text-emerald-600 mb-4 flex items-center gap-1 text-sm font-bold">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> 返回列表
          </button>
          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <h3 className="text-xl font-bold text-slate-800">{selectedClass.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{selectedClass.date} • {selectedClass.time} • {selectedClass.location}</p>
          </div>
          
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">點名與預約清單</h4>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                {selectedClass.attendees.length} / {selectedClass.maxCapacity}
              </span>
            </div>
            
            <div className="space-y-3">
              {sortedMembersForAttendance.map(member => {
                const isPresent = selectedClass.attendees.includes(member.id);
                return (
                  <div key={member.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPresent ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${isPresent ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                          {member.name[0]}
                        </div>
                        {isPresent && (
                          <div className="absolute -right-1 -bottom-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-white shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-700">{member.name}</p>
                          {isPresent && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">已簽到</span>}
                        </div>
                        <p className="text-xs text-slate-500">剩餘次數: {member.remainingClasses} 堂</p>
                      </div>
                    </div>
                    {isPresent ? (
                      <button 
                        onClick={() => removeAttendance(selectedClass.id, member.id)}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold border border-red-100 active:bg-red-100"
                      >
                        撤銷點名
                      </button>
                    ) : (
                      <button 
                        disabled={member.remainingClasses <= 0}
                        onClick={() => markAttendance(selectedClass.id, member.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${member.remainingClasses > 0 ? 'bg-emerald-600 text-white shadow-md active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                      >
                        {member.remainingClasses > 0 ? '點名扣卡' : '點數不足'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.sort((a,b) => b.date.localeCompare(a.date)).map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedClass(c)}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer active:bg-slate-50 transition-colors"
            >
              <div>
                <h4 className="font-bold text-slate-700 text-lg">{c.title}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{c.date}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md">{c.time}</span>
                  <span className="text-emerald-600 font-bold">{c.attendees.length} / {c.maxCapacity} 人</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
              尚無課程安排
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassManager;
