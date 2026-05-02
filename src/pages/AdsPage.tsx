import React from 'react';
import { PlayCircle, ShieldIcon, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { auth, db, doc, updateDoc, increment, addDoc, collection, serverTimestamp } from '@/src/lib/firebase';
import { addBalance } from '@/src/services/wallet';
import { UserProfile, AdConfig, AppStats } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AdsPageProps {
  profile: UserProfile;
  stats: AppStats;
  onRewardReceived: () => void;
}

export const AdsPage: React.FC<AdsPageProps> = ({ profile, stats, onRewardReceived }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentAdIndex, setCurrentAdIndex] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(60);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const ads: AdConfig[] = [
    { id: '1', providerName: 'Partner A', scriptUrl: '#', reward: stats?.adReward || 0.04, duration: 20, cta: 'Check it out', isActive: true },
    { id: '2', providerName: 'Partner B', scriptUrl: '#', reward: stats?.adReward || 0.04, duration: 20, cta: 'Learn More', isActive: true },
    { id: '3', providerName: 'Partner C', scriptUrl: '#', reward: stats?.adReward || 0.04, duration: 20, cta: 'Join Now', isActive: true },
  ];

  const startAds = () => {
    if ((profile?.dailyAdsWatched || 0) >= (stats?.maxDailyAds || 20)) {
       setError("You have reached your daily limit. Please come back tomorrow!");
       return;
    }
    setIsPlaying(true);
    setTimeLeft(60);
    setIsCompleted(false);
    setError(null);
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && timeLeft > 0 && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isPaused]);

  React.useEffect(() => {
    if (isPlaying && timeLeft <= 0) {
      handleComplete();
    }
    if (timeLeft === 40) setCurrentAdIndex(1);
    if (timeLeft === 20) setCurrentAdIndex(2);
  }, [timeLeft, isPlaying]);

  // Handle visibility API (Anti-cheat)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    setIsLoading(true);

    try {
      const reward = stats?.adReward || 0.04;
      await addBalance(profile.uid, reward, "Watched ad reward");

      // Update daily ad count locally/in Firestore
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        dailyAdsWatched: increment(1)
      });

      setIsCompleted(true);
      onRewardReceived();
    } catch (err) {
      console.error(err);
      setError("Failed to claim reward. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeAd = () => {
    setIsPlaying(false);
    setCurrentAdIndex(0);
    setTimeLeft(60);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl text-center">
        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 mx-auto mb-6 border border-purple-500/20">
          <PlayCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Watch Ads & Earn</h2>
        <p className="text-slate-400 mt-2 max-w-md mx-auto">
          You will earn <span className="font-bold text-white tracking-widest">{formatCurrency(stats?.adReward || 0.04)}</span> for watching a 60-second ad rotation.
        </p>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center gap-2 font-medium">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {!isPlaying && !isCompleted && (
          <button
            onClick={startAds}
            disabled={(profile?.dailyAdsWatched || 0) >= (stats?.maxDailyAds || 20)}
            className="mt-8 bg-white text-slate-950 px-10 py-4 rounded-full font-black text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
          >
            Start Viewing Ads
          </button>
        )}
        
        {isCompleted && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-8"
          >
            <div className="p-8 bg-green-500/10 rounded-[2rem] inline-block border border-green-500/20 mb-6 backdrop-blur-md">
              <CheckCircle2 size={48} className="text-green-400 mx-auto shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
              <p className="text-white font-black text-xl mt-4">Reward Earned!</p>
              <p className="text-green-400 font-medium mt-1">+{formatCurrency(stats?.adReward || 0.04)} added to wallet</p>
            </div>
            <div>
              <button
                onClick={() => setIsCompleted(false)}
                className="text-slate-400 font-bold hover:text-white transition-colors flex items-center gap-2 mx-auto"
              >
                Watch Another Ad
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ad Overlay */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0F172A] flex flex-col p-4 md:p-8"
          >
            {/* Ad Header */}
            <div className="flex items-center justify-between text-white mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <ShieldIcon className="text-blue-400" size={24} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Advertising Partner</p>
                  <p className="text-lg font-black tracking-tight">{ads[currentAdIndex].providerName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Time Remaining</p>
                  <p className={cn(
                    "text-3xl font-black tabular-nums tracking-tighter",
                    timeLeft < 10 ? "text-red-500 animate-pulse" : "text-white"
                  )}>
                    {timeLeft}s
                  </p>
                </div>
                {timeLeft === 0 ? (
                   <button onClick={closeAd} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                    <X size={24} />
                  </button>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-blue-400">
                    {timeLeft}
                  </div>
                )}
              </div>
            </div>

            {/* Main Ad Area */}
            <div className="flex-1 bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center p-8">
               {isPaused && (
                 <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
                    <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 mb-6 border border-yellow-500/20">
                      <AlertCircle size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-white">Timer Paused</h3>
                    <p className="text-slate-400 mt-4 text-lg max-w-sm">Please keep this window active to continue your session.</p>
                 </div>
               )}

               <div className="space-y-10 max-w-3xl">
                  <div className="space-y-4">
                    <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-indigo-600/20">Sponsored Promotion</span>
                    <h2 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter">
                      The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Finance</span> is Here.
                    </h2>
                  </div>
                  
                  <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
                    Experience seamless transactions and institutional-grade security with the global leader in {ads[currentAdIndex].providerName}.
                  </p>

                  <a 
                    href="#" 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-4 bg-white text-slate-950 px-12 py-5 rounded-full font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
                  >
                    {ads[currentAdIndex].cta}
                    <ExternalLink size={24} />
                  </a>
               </div>

               {/* Progress bar */}
               <div className="absolute bottom-0 left-0 w-full h-3 bg-white/5">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft/60) * 100}%` }}
                    transition={{ ease: 'linear', duration: 1 }}
                  />
               </div>
            </div>

            {/* Footer info */}
            <div className="mt-8 flex justify-between items-center text-[10px] uppercase font-black text-slate-600 tracking-[0.3em]">
               <div className="flex items-center gap-4">
                 <span className="text-indigo-400">Ad 00{currentAdIndex + 1}</span>
                 <span className="opacity-20">|</span>
                 <span>Ad Session</span>
               </div>
               <div>Please do not close this window</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info card */}
      <div className="bg-[#1E293B]/40 backdrop-blur-xl p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 justify-between border border-white/10 shadow-2xl">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-white/5">
              <ShieldIcon className="text-indigo-400" size={28} />
            </div>
            <div>
              <p className="font-black text-white text-lg">Verification System</p>
              <p className="text-sm text-slate-400 font-medium leading-tight">Switching windows will result in instant session pause.</p>
            </div>
         </div>
         <div className="text-center md:text-right px-8 py-4 bg-white/5 rounded-[2rem] border border-white/5">
            <p className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-1">Reward Amount</p>
            <p className="text-2xl font-black text-white">{formatCurrency(stats?.adReward || 0.04)} / Ad</p>
         </div>
      </div>
    </div>
  );
};
