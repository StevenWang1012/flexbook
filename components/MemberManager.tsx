
import React, { useState } from 'react';
import { Member } from '../types';

interface MemberManagerProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

const MemberManager: React.FC<MemberManagerProps> = ({ members, setMembers }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState<Member | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    phone: '',
    packageType: 'package_10',
    remainingClasses: 10
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const initialClasses = formData.remainingClasses || 0;
    const newMember: Member = {
      id: Date.now().toString(),
      name: formData.name || '',
      phone: formData.phone || '',
      packageType: formData.packageType as any,
      remainingClasses: initialClasses,
      totalPurchasedClasses: initialClasses, // 初始化時累積等於剩餘
      joinDate: new Date().toISOString().split('T')[0],
      note: ''
    };
    setMembers([...members, newMember]);
    setShowAddForm(false);
    setFormData({ name: '', phone: '', packageType: 'package_10', remainingClasses: 10 });
  };

  const handleTopUp = () => {
    if (!showTopUpModal) return;
    setMembers(prev => prev.map(m => 
      m.id === showTopUpModal.id 
        ? { 
            ...m, 
            remainingClasses: m.remainingClasses + topUpAmount,
            totalPurchasedClasses: (m.totalPurchasedClasses || 0) + topUpAmount // 儲值時同步累加總數
          } 
        : m
    ));
    setShowTopUpModal(null);
    setTopUpAmount(10);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">會員管理</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"
        >
          + 新增會員
        </button>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="搜尋會員姓名或電話..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl px-10 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <svg className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="space-y-3">
        {filteredMembers.map(member => (
          <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                {member.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-700">{member.name}</h4>
                <p className="text-xs text-slate-500">{member.phone}</p>
                <p className="text-[10px] text-slate-400 mt-1">累積購買: {member.totalPurchasedClasses || 0} 堂</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">目前剩餘</p>
                <p className={`text-lg font-bold leading-none ${member.remainingClasses < 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {member.remainingClasses}
                </p>
              </div>
              <button 
                onClick={() => setShowTopUpModal(member)}
                className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100 active:bg-emerald-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                儲值課程
              </button>
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="text-center py-10 text-slate-400">找不到相符的會員</div>
        )}
      </div>

      {/* 新增會員 Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slideUp">
            <h3 className="text-lg font-bold mb-4">新增會員資料</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">姓名</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">電話</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">方案類型</label>
                  <select value={formData.packageType} onChange={e => setFormData({...formData, packageType: e.target.value as any})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                    <option value="single">單次體驗</option>
                    <option value="package_10">10 堂課包</option>
                    <option value="monthly">月費制</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">初始堂數</label>
                  <input type="number" value={formData.remainingClasses} onChange={e => setFormData({...formData, remainingClasses: parseInt(e.target.value)})} className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
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

      {/* 儲值課程 Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slideUp">
            <h3 className="text-lg font-bold">為 {showTopUpModal.name} 儲值</h3>
            <p className="text-xs text-slate-500 mb-6">目前累積已購：{showTopUpModal.totalPurchasedClasses || 0} 堂</p>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 10, 20].map(amt => (
                <button 
                  key={amt}
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-3 rounded-xl border font-bold transition-all ${topUpAmount === amt ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-500'}`}
                >
                  +{amt} 堂
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-500 uppercase">自定義堂數</label>
              <input 
                type="number" 
                value={topUpAmount}
                onChange={e => setTopUpAmount(parseInt(e.target.value) || 0)}
                className="w-full mt-1 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center text-xl font-bold"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowTopUpModal(null)} className="flex-1 py-3 text-slate-500 font-bold">取消</button>
              <button 
                onClick={handleTopUp}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100"
              >
                確認儲值
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManager;
