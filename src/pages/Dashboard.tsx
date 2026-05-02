import React from 'react';
import { PlayCircle, TrendingUp, DollarSign, Clock, ChevronRight, ClipboardList, Users } from 'lucide-react';
import { formatCurrency } from '@/src/lib/utils';
import { UserProfile, AppStats } from '@/src/types';
import { Link } from 'react-router-dom';

interface DashboardProps {
  profile: UserProfile;
  stats: AppStats;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, stats }) => {
  const remainingAds = Math.max(0, (stats?.maxDailyAds || 20) - (profile?.dailyAdsWatched || 0));

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Hi, {profile?.displayName?.split(' ')[0] || 'User'} 👋
          </h2>
          <p className="text-slate-400 font-medium">Ready to earn some dollars today?</p>
        </div>
        <div className="px-4 py-2 bg-white/5 border border-white/5 text-slate-300 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-md">
          <Clock size={16} />
          Limit resets in 12h 45m
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
            <DollarSign size={20} />
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Balance</p>
          <h3 className="text-3xl font-black text-white mt-1">
            {formatCurrency(profile.balance)}
          </h3>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Earnings</p>
          <h3 className="text-3xl font-black text-white mt-1">
            {formatCurrency(profile.totalEarned)}
          </h3>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
            <PlayCircle size={20} />
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Remaining Ads</p>
          <h3 className="text-3xl font-black text-white mt-1">
            {remainingAds} / {stats?.maxDailyAds || 20}
          </h3>
        </div>
      </div>

      {/* Main CTA */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/40 group-hover:scale-110 transition-transform duration-500">
               <PlayCircle size={48} className="text-white fill-current ml-1" />
            </div>
            <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Kumpulkan Dolar Setiap Detik</h3>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto text-lg font-medium">
              Selesaikan durasi 60 detik per sesi iklan dan dapatkan reward langsung ke kantongmu.
            </p>
            <Link 
              to="/ads"
              className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-xl hover:shadow-[0_0_40px_-5px_rgba(147,51,234,0.5)] transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Mulai Nonton Iklan
              <ChevronRight size={24} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Missions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/tasks" className="group flex items-center justify-between p-6 bg-[#1E293B]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-lg hover:border-purple-500/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 border border-white/5">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="font-black text-white">Complete Tasks</p>
              <p className="text-sm text-slate-400">Join Telegram or Sub YT to earn more</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 group-hover:text-purple-400 translate-x-0 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/referrals" className="group flex items-center justify-between p-6 bg-[#1E293B]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-lg hover:border-blue-500/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 border border-white/5">
              <Users size={24} />
            </div>
            <div>
              <p className="font-black text-white">Refer & Earn</p>
              <p className="text-sm text-slate-400">Invite friends and get bonus rewards</p>
            </div>
          </div>
          <ChevronRight className="text-slate-600 group-hover:text-blue-400 translate-x-0 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
};
