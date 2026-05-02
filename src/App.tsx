import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db, onAuthStateChanged, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from './lib/firebase';
import { UserProfile, AppStats } from './types';

// Components
import { Layout } from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { AdsPage } from './pages/AdsPage';
import { TasksPage } from './pages/TasksPage';
import { WalletPage } from './pages/WalletPage';
import { AdminPanel } from './pages/AdminPanel';
import { ReferralPage, LeaderboardPage } from './pages/SocialPages';

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [stats, setStats] = React.useState<AppStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Telegram Auto Login
  React.useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData && !auth.currentUser) {
       auth.loginWithTelegram(tg.initData)
         .then(() => tg.expand())
         .catch(err => console.error("Telegram login failed", err));
    }
  }, []);

  // Auth observer
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Real-time profile listener
        const profileUnsub = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile({ ...data, uid: docSnap.id });
          } else {
            setProfile(null);
          }
        });
        return () => profileUnsub();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Global stats listener
  React.useEffect(() => {
    const statsUnsub = onSnapshot(doc(db, 'stats', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as AppStats);
      } else {
        // Initialize default stats if missing
        const defaults: AppStats = {
          minWithdrawal: 1.00,
          adReward: 0.04,
          maxDailyAds: 20,
          totalUsers: 0,
          totalPaidOut: 0
        };
        setStats(defaults);
        setDoc(doc(db, 'stats', 'global'), defaults);
      }
    });
    return () => statsUnsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
           GetMoneyPay
        </h1>
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-purple-600 animate-[loading_2s_infinite]" />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes loading {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 50%; margin-left: 25%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage type="login" />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage type="login" />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <AuthPage type="register" />} />
        <Route path="/regis" element={user ? <Navigate to="/dashboard" /> : <AuthPage type="register" />} />
        <Route path="/reset-password" element={<AuthPage type="reset-password" />} />

        {/* Dashboard and Home */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute profile={profile}>
            <Dashboard profile={profile!} stats={stats!} />
          </ProtectedRoute>
        } />
        
        {/* Ad Routes */}
        <Route path="/ads" element={
          <ProtectedRoute profile={profile}>
            <AdsPage profile={profile!} stats={stats!} onRewardReceived={() => {}} />
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute profile={profile}>
            <TasksPage profile={profile!} />
          </ProtectedRoute>
        } />

        <Route path="/wallet" element={
          <ProtectedRoute profile={profile}>
            <WalletPage profile={profile!} minWithdrawal={stats?.minWithdrawal || 1.0} onRefresh={() => {}} />
          </ProtectedRoute>
        } />

        <Route path="/referrals" element={
          <ProtectedRoute profile={profile}>
            <ReferralPage profile={profile!} />
          </ProtectedRoute>
        } />

        <Route path="/leaderboard" element={
          <ProtectedRoute profile={profile}>
            <LeaderboardPage />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly profile={profile}>
            <AdminPanel currentStats={stats!} onStatsUpdate={() => {}} />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
