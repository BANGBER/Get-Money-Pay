import React, { useEffect, useState } from "react";
import { auth, onAuthStateChanged } from "../lib/firebase";
import { Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import { UserProfile } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  profile?: UserProfile | null;
}

export default function ProtectedRoute({ children, adminOnly = false, profile }: ProtectedRouteProps) {
  const [user, setUser] = useState<any>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6">
          <div className="w-10 h-10 text-indigo-500">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Telegram Only</h1>
        <p className="text-slate-400 max-w-xs mx-auto">
          Please open this application through the Telegram Bot to start earning rewards.
        </p>
      </div>
    );
  }
  
  if (!profile && !adminOnly) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
  }
  
  if (adminOnly && !profile?.isAdmin) return <Navigate to="/" />;

  return (
    <Layout user={user} profile={profile}>
      {children}
    </Layout>
  );
}
