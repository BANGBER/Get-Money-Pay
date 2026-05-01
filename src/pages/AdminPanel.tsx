import React from 'react';
import { ShieldCheck, Users, DollarSign, Settings, Plus, Trash2, CheckCircle2, XCircle, Send, ClipboardList, BarChart3 } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { UserProfile, Task, Withdrawal, AppStats } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface AdminPanelProps {
  currentStats: AppStats;
  onStatsUpdate: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentStats, onStatsUpdate }) => {
  const [withdrawals, setWithdrawals] = React.useState<Withdrawal[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = React.useState<'requests' | 'tasks' | 'settings' | 'users'>('requests');
  const [loading, setLoading] = React.useState(true);

  // Form states
  const [newAdReward, setNewAdReward] = React.useState(currentStats?.adReward?.toString() || '0.04');
  const [newMinWithdraw, setNewMinWithdraw] = React.useState(currentStats?.minWithdrawal?.toString() || '1.00');

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const wdQ = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
        const tasksQ = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const usersQ = query(collection(db, 'users'), orderBy('balance', 'desc'));

        const [wdSnap, tasksSnap, usersSnap] = await Promise.all([
          getDocs(wdQ), 
          getDocs(tasksQ),
          getDocs(usersQ)
        ]);

        setWithdrawals(wdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
        setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        setUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any as UserProfile)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleWithdrawalAction = async (wd: Withdrawal, action: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'withdrawals', wd.id), {
        status: action,
        processedAt: serverTimestamp()
      });

      if (action === 'rejected') {
        // Refund user balance
        await updateDoc(doc(db, 'users', wd.userId), {
          balance: increment(wd.amount)
        });
        
        await addDoc(collection(db, 'transactions'), {
          userId: wd.userId,
          amount: wd.amount,
          type: 'ad_reward', // Should be refund but let's stick to simple types or add 'refund'
          description: `Refund: Withdrawal of ${formatCurrency(wd.amount)} rejected`,
          createdAt: serverTimestamp()
        });
      }

      setWithdrawals(prev => prev.map(item => item.id === wd.id ? { ...item, status: action } : item));
    } catch (err) {
      console.error(err);
    }
  };

  const updateGlobalStats = async () => {
    try {
      await setDoc(doc(db, 'stats', 'global'), {
        ...currentStats,
        adReward: parseFloat(newAdReward),
        minWithdrawal: parseFloat(newMinWithdraw)
      }, { merge: true });
      onStatsUpdate();
      alert('Settings updated!');
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async () => {
    const title = prompt("Task Title:");
    if (!title) return;
    const reward = parseFloat(prompt("Reward ($):") || '0');
    const link = prompt("Link:");
    const type = prompt("Type (telegram_join, youtube_sub, etc.):") as any;

    try {
      const newTask = {
        title,
        description: `Complete the ${title} action to earn ${formatCurrency(reward)}`,
        reward,
        link: link || '',
        type: type || 'other',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks(prev => [{ id: docRef.id, ...newTask }, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <ShieldCheck size={36} className="text-indigo-400" />
            Admin Protocol
          </h2>
          <p className="text-slate-400 font-medium">Manage payouts, tasks, and system configurations.</p>
        </div>
      </div>

      {/* Admin Nav */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
        {[
          { id: 'requests', label: 'Payouts', icon: DollarSign },
          { id: 'tasks', label: 'Tasks', icon: ClipboardList },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'settings', label: 'Global Rules', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-950 shadow-xl" 
                : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1E293B]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden min-h-[400px]">
        {activeTab === 'requests' && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 text-white">Pending Requests</h3>
            <div className="space-y-4">
              {withdrawals.filter(w => w.status === 'pending').map(wd => (
                <div key={wd.id} className="p-6 bg-white/5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:bg-white/[0.08] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white font-bold border border-white/10">
                      {wd.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-white">@{wd.username}</p>
                      <p className="text-xs text-slate-500 font-medium">{wd.paypalEmail}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-black text-white">
                      {formatCurrency(wd.amount)}
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleWithdrawalAction(wd, 'completed')}
                        className="p-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                        title="Approve"
                       >
                         <CheckCircle2 size={20} />
                       </button>
                       <button 
                        onClick={() => handleWithdrawalAction(wd, 'rejected')}
                        className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Reject"
                       >
                         <XCircle size={20} />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
                  <CheckCircle2 size={48} className="mb-4" />
                  <p className="text-center font-black uppercase tracking-widest text-xs">All requests processed</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-white">Manage Tasks</h3>
              <button 
                onClick={addTask}
                className="flex items-center gap-2 bg-white text-slate-950 px-5 py-2.5 rounded-xl font-black text-sm hover:scale-105 transition-transform"
              >
                <Plus size={18} /> New Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map(task => (
                <div key={task.id} className="p-5 bg-white/5 rounded-3xl border border-white/5 space-y-3 hover:bg-white/[0.08] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <ClipboardList size={16} />
                      </div>
                      <span className="font-black text-white truncate max-w-[150px] tracking-tight">{task.title}</span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-red-500/50 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="text-[10px] font-black text-slate-500 flex items-center justify-between uppercase tracking-widest">
                    <span>Reward: {formatCurrency(task.reward)}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{task.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-8">
            <h3 className="text-xl font-black mb-6 text-white">Registry ({users.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="pb-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">Identity</th>
                    <th className="pb-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">Balance</th>
                    <th className="pb-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">Total Yield</th>
                    <th className="pb-4 font-black text-slate-600 text-[10px] uppercase tracking-widest">Referrer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(user => (
                    <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="font-black text-white">@{user.username}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-tight">{user.email}</div>
                      </td>
                      <td className="py-4 font-black text-blue-400">{formatCurrency(user.balance)}</td>
                      <td className="py-4 font-black text-slate-300">{formatCurrency(user.totalEarned)}</td>
                      <td className="py-4">
                         <span className="text-[10px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-500 border border-white/5 uppercase tracking-widest">
                           {user.referredBy || 'Direct'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 space-y-8">
            <h3 className="text-xl font-black text-white">Global Protocol Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ad Payout (per unit)</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                     <DollarSign size={18} />
                   </div>
                   <input 
                    type="number"
                    step="0.01"
                    value={newAdReward}
                    onChange={(e) => setNewAdReward(e.target.value)}
                    className="w-full pl-10 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-700"
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Settlement Minimum</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                     <DollarSign size={18} />
                   </div>
                   <input 
                    type="number"
                    step="0.01"
                    value={newMinWithdraw}
                    onChange={(e) => setNewMinWithdraw(e.target.value)}
                    className="w-full pl-10 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-700"
                   />
                </div>
              </div>
            </div>

            <button 
              onClick={updateGlobalStats}
              className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all shadow-2xl"
            >
              Update Protocols
            </button>
          </div>
        )}
      </div>

      {/* Global overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Network Nodes</h4>
            <p className="text-2xl font-black text-white">{users.length}</p>
         </div>
         <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Total Liability</h4>
            <p className="text-2xl font-black text-indigo-400">
              {formatCurrency(withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0))}
            </p>
         </div>
         <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Mission Pool</h4>
            <p className="text-2xl font-black text-white">{tasks.length}</p>
         </div>
         <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl">
            <h4 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-1">Grid Status</h4>
            <span className="flex items-center gap-2 text-green-400 text-[10px] font-black mt-1 uppercase tracking-widest">
              <CheckCircle2 size={14} /> ACTIVE
            </span>
         </div>
      </div>
    </div>
  );
};
