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
            Hi, {profile.displayName.split(' ')[0]} 👋
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
        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:translate-y-[-2px]">
          <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-4 border border-purple-500/20">
            <DollarSign size={24} />
          </div>
          <p className="text-slate-400 font-medium text-sm">Available Balance</p>
          <h3 className="text-3xl font-black text-white mt-1">
            {formatCurrency(profile.balance)}
          </h3>
        </div>

        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:translate-y-[-2px]">
          <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
            <TrendingUp size={24} />
          </div>
          <p className="text-slate-400 font-medium text-sm">Total Earnings</p>
          <h3 className="text-3xl font-black text-white mt-1">
            {formatCurrency(profile.totalEarned)}
          </h3>
        </div>

        <div className="bg-[#1E293B]/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:translate-y-[-2px] lg:col-span-1 md:col-span-2">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
            <PlayCircle size={24} />
          </div>
          <p className="text-slate-400 font-medium text-sm">Daily Ads Limit</p>
          <div className="flex items-end justify-between mt-1">
            <h3 className="text-3xl font-black text-white">
               {profile.dailyAdsWatched || 0} / {stats?.maxDailyAds || 20}
            </h3>
            <p className="text-indigo-400 font-bold mb-1 text-sm">
              {remainingAds} left
            </p>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
              style={{ width: `${Math.min(100, ((profile.dailyAdsWatched || 0) / (stats?.maxDailyAds || 20)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/90 to-blue-700/90 rounded-[2.5rem] p-8 md:p-12 text-center shadow-xl border border-white/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <PlayCircle size={240} className="-mr-20 -mt-20" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            Boost Your Balance Now!
          </h2>
          <p className="text-purple-100/80 max-w-md mx-auto text-lg font-medium">
            Watch simple 60-second ads and earn up to {formatCurrency(stats?.adReward || 0.04)} per view.
          </p>
          
          <Link 
            to="/ads"
            className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          >
            Start Watching
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
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
