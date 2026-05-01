import React from 'react';
import { Wallet, DollarSign, History, Send, AlertCircle, CheckCircle2, Clock, XCircle, CreditCard, ChevronRight } from 'lucide-react';
import { db } from '@/src/lib/firebase';
import { collection, query, getDocs, where, doc, updateDoc, increment, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { UserProfile, Transaction, Withdrawal } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface WalletPageProps {
  profile: UserProfile;
  minWithdrawal: number;
  onRefresh: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ profile, minWithdrawal, onRefresh }) => {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = React.useState<Withdrawal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [paypalEmail, setPaypalEmail] = React.useState(profile.paypalEmail || '');
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const txQ = query(
          collection(db, 'transactions'), 
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );
        const wdQ = query(
          collection(db, 'withdrawals'), 
          where('userId', '==', profile.uid),
          orderBy('createdAt', 'desc')
        );

        const [txSnap, wdSnap] = await Promise.all([getDocs(txQ), getDocs(wdQ)]);
        
        setTransactions(txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
        setWithdrawals(wdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.uid]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const amount = parseFloat(withdrawAmount);

    if (!paypalEmail) return setStatus({ type: 'error', msg: 'Please provide your PayPal email' });
    if (isNaN(amount) || amount < minWithdrawal) return setStatus({ type: 'error', msg: `Minimum withdrawal is ${formatCurrency(minWithdrawal)}` });
    if (amount > profile.balance) return setStatus({ type: 'error', msg: 'Insufficient balance' });

    setIsSubmitting(true);
    try {
      // 1. Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: profile.uid,
        username: profile.username,
        paypalEmail,
        amount,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Deduct from balance
      await updateDoc(doc(db, 'users', profile.uid), {
        balance: increment(-amount),
        paypalEmail // Update saved email
      });

      // 3. Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        amount: -amount,
        type: 'withdrawal',
        description: `Withdrawal request to ${paypalEmail}`,
        createdAt: serverTimestamp()
      });

      setStatus({ type: 'success', msg: 'Withdrawal request submitted successfully!' });
      setWithdrawAmount('');
      onRefresh();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'rejected': return <XCircle className="text-red-500" size={16} />;
      default: return <Clock className="text-yellow-500" size={16} />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Withdraw Form */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#4136f1] to-[#8b5cf6] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/10">
             <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl transition-all group-hover:scale-150 duration-700" />
             <div className="flex justify-between items-center mb-10 relative z-10">
                <div>
                  <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px] mb-1">Vault Balance</p>
                  <p className="text-sm font-medium text-white/80 tracking-tight">Ready for deployment</p>
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
                  <CreditCard size={24} />
                </div>
             </div>
             <h2 className="text-6xl font-black mb-4 tracking-tighter relative z-10">{formatCurrency(profile.balance)}</h2>
             <div className="flex items-center gap-2 relative z-10">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (profile.balance / minWithdrawal) * 100)}%` }} />
                </div>
                <span className="text-[10px] font-black text-white/60 uppercase">{Math.round(Math.min(100, (profile.balance / minWithdrawal) * 100))}% to Min</span>
             </div>
          </div>

          <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                Withdraw
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </h3>
              <div className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-slate-400 tracking-widest">
                PAYPAL NETWORK
              </div>
            </div>
            
            <form onSubmit={handleWithdraw} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">PayPal Gateway</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="receiver@paypal.com"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="number"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Entry amount (Min ${formatCurrency(minWithdrawal)})`}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {status && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-2xl flex items-center gap-3 font-bold text-sm border",
                    status.type === 'success' 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  )}
                >
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  {status.msg}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-lg hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                {isSubmitting ? (
                   <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} />
                    Execute Withdrawal
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: History */}
        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Ledger history</h3>
              <p className="text-xs text-slate-500 font-medium">Internal transaction log</p>
            </div>
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-indigo-400">
              <History size={20} />
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 space-y-4 opacity-50">
                <History size={48} strokeWidth={1} />
                <p className="font-black uppercase tracking-widest text-[10px]">No ledger entries found</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-transparent hover:border-white/5 hover:bg-white/[0.07] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                      tx.amount > 0 
                        ? "bg-green-500/10 text-green-400 group-hover:bg-green-500 group-hover:text-white" 
                        : "bg-white/10 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"
                    )}>
                      {tx.type === 'withdrawal' ? <CreditCard size={20} /> : <DollarSign size={20} />}
                    </div>
                    <div>
                      <p className="font-black text-white text-sm leading-tight group-hover:translate-x-1 transition-transform">{tx.description}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase mt-1 flex items-center gap-2">
                        <Clock size={10} />
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Syncing...'}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "text-lg font-black tracking-tighter",
                    tx.amount > 0 ? "text-green-400" : "text-white"
                  )}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>

          {withdrawals.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/5">
               <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Settlement status</h4>
               <div className="space-y-3">
                 {withdrawals.slice(0, 3).map(wd => (
                   <div key={wd.id} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-colors">
                     <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center",
                         wd.status === 'completed' ? "bg-green-500/20 text-green-400" :
                         wd.status === 'rejected' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                       )}>
                         {getStatusIcon(wd.status)}
                       </div>
                       <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{wd.status}</span>
                     </div>
                     <div className="text-sm font-black text-white">{formatCurrency(wd.amount)}</div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
