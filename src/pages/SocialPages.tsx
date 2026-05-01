import React from 'react';
import { Users, Share2, Clipboard, CheckCircle2, Gift, ChevronRight, Gift as GiftIcon, Link as LinkIcon } from 'lucide-react';
import { UserProfile } from '@/src/types';
import { db } from '@/src/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface ReferralPageProps {
  profile: UserProfile;
}

export const ReferralPage: React.FC<ReferralPageProps> = ({ profile }) => {
  const [copied, setCopied] = React.useState(false);
  const [referrals, setReferrals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const inviteLink = `${window.location.origin}/register?ref=${profile.referralCode}`;

  React.useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const q = query(collection(db, 'users'), where('referredBy', '==', profile.uid));
        const snap = await getDocs(q);
        setReferrals(snap.docs.map(doc => doc.data()));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, [profile.uid]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-[#4136f1] to-[#8b5cf6] rounded-[4rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10">
         <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <GiftIcon size={280} className="-mr-20 -mt-20 rotate-12" />
         </div>

         <div className="relative z-10 max-w-lg space-y-6">
            <h2 className="text-5xl font-black tracking-tighter leading-[1.1]">Refer Friends,<br/>Earn Together!</h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed">
              Propagate your link across the network. For every successful node registration, you both receive premium rewards.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-xl group">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Your Protocol Code</p>
                 <p className="text-3xl font-black tracking-tighter transition-transform group-hover:scale-105 duration-300">{profile.referralCode}</p>
              </div>
              <div 
                className="flex items-center justify-center gap-3 px-8 py-5 bg-white text-slate-950 rounded-3xl font-black cursor-pointer hover:bg-slate-100 active:scale-95 transition-all shadow-2xl whitespace-nowrap" 
                onClick={copyToClipboard}
              >
                 {copied ? <CheckCircle2 size={24} className="text-green-500" /> : <Share2 size={24} />}
                 {copied ? 'Protocol Copied' : 'Launch Invite'}
              </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Referral Link */}
        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/20">
              <LinkIcon size={20} className="text-indigo-400" />
            </div>
            Access Terminal
          </h3>
          <div className="relative group">
            <input 
              readOnly 
              value={inviteLink}
              className="w-full px-6 py-5 rounded-3xl bg-white/5 border border-white/5 font-medium text-slate-400 pr-16 focus:border-indigo-500/50 transition-colors"
            />
            <button 
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all"
            >
              <Clipboard size={18} />
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-2">
            Disseminate this link via standard communication channels.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col justify-center text-center space-y-4 group">
            <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl">
               <Users size={36} />
            </div>
            <div>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] mb-1">Nodes Recruited</p>
              <h3 className="text-6xl font-black text-white tracking-tighter">{referrals.length}</h3>
            </div>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Share to unlock higher tiers</p>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
         <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black text-white tracking-tight">Recent Nodes</h3>
           <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Log</div>
         </div>
         {loading ? (
            <div className="py-20 text-center text-slate-500 font-black animate-pulse uppercase tracking-[0.2em] text-xs">Synchronizing team data...</div>
         ) : referrals.length === 0 ? (
            <div className="py-20 text-center text-slate-600 flex flex-col items-center gap-4">
               <Users size={48} strokeWidth={1} className="opacity-20" />
               <div>
                 <p className="font-black uppercase tracking-widest text-xs">No nodes detected</p>
                 <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">Activate referral protocol to grow</p>
               </div>
            </div>
         ) : (
            <div className="space-y-4">
              {referrals.map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 font-black border border-white/5 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                         {ref.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm group-hover:translate-x-1 transition-transform">@{ref.username}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase mt-1 tracking-tight">Joined {new Date(ref.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="text-[10px] font-black text-green-400 bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20 uppercase tracking-widest">
                      Operational
                   </div>
                </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
};

interface LeaderboardPageProps {}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = () => {
  const [leaders, setLeaders] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('totalEarned', 'desc'), limit(10));
        const snap = await getDocs(q);
        setLeaders(snap.docs.map(doc => doc.data() as UserProfile));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
         <h2 className="text-4xl font-black text-white tracking-tighter">Prime Nodes</h2>
         <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">The Elite Sector of the Network</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {loading ? (
           <div className="py-20 text-center font-black text-slate-600 animate-pulse text-sm uppercase tracking-widest">Ranking Global Nodes...</div>
        ) : (
          leaders.map((user, idx) => (
            <motion.div 
              key={user.uid}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all group",
                idx === 0 ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border-yellow-500/30 shadow-2xl shadow-yellow-500/10" :
                idx === 1 ? "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border-slate-400/30" :
                idx === 2 ? "bg-gradient-to-r from-orange-400/20 to-orange-500/10 border-orange-400/30" :
                "bg-[#1E293B]/40 backdrop-blur-xl border-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "w-14 h-14 flex items-center justify-center font-black rounded-2xl shrink-0 text-xl border shadow-xl transition-transform group-hover:rotate-12 duration-500",
                idx === 0 ? "bg-yellow-500 text-white border-yellow-400" :
                idx === 1 ? "bg-slate-400 text-white border-slate-300" :
                idx === 2 ? "bg-orange-500 text-white border-orange-400" :
                "bg-white/5 text-slate-500 border-white/5"
              )}>
                {idx + 1}
              </div>

              <div className="flex-1 flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 shrink-0 text-lg transition-all group-hover:bg-white group-hover:text-slate-900 group-hover:-translate-y-1">
                  {user.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-white truncate tracking-tight text-lg">@{user.username}</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mt-1">Signal since {new Date(user.createdAt).getFullYear()}</p>
                </div>
              </div>

              <div className="text-right">
                <p className={cn(
                  "text-2xl font-black tracking-tighter leading-none",
                  idx === 0 ? "text-yellow-400" : "text-white"
                )}>{formatCurrency(user.totalEarned)}</p>
                <p className="text-[10px] font-black text-slate-600 uppercase mt-1 tracking-widest">Yield Output</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
