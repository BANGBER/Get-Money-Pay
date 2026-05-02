import React, { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import { UserProfile } from "../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  profile?: UserProfile | null;
}

export default function ProtectedRoute({ children, adminOnly = false, profile }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
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

  if (!user) return <Navigate to="/auth" />;
  
  if (adminOnly && !profile?.isAdmin) return <Navigate to="/" />;

  return (
    <Layout user={user} profile={profile}>
      {children}
    </Layout>
  );
}
