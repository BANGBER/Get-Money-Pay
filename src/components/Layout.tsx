import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Wallet, 
  PlayCircle, 
  ClipboardList, 
  Users, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Trophy,
  Menu,
  X,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { auth } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  profile: any;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, profile }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Watch Ads', path: '/ads', icon: PlayCircle },
    { name: 'Tasks', path: '/tasks', icon: ClipboardList },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
    { name: 'Referrals', path: '/referrals', icon: Users },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  if (profile?.isAdmin) {
    navItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col md:flex-row text-white">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          GetMoneyPay
        </h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full bg-gradient-to-b from-[#1e1b4b] to-[#0f172a]">
          <div className="p-6 border-b border-white/5 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white italic">
                GetMoneyPay
              </h1>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <div className="flex items-center justify-between md:hidden mb-6">
              <span className="font-bold text-white">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive 
                    ? "bg-white/10 text-white border border-white/10 shadow-lg" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={cn(isActive ? "text-blue-400" : "opacity-50")} />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold border border-white/20">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">@{profile?.username}</p>
                <p className="text-[10px] text-slate-400 truncate tracking-tight">{profile?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0F172A] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(124,58,237,0.1),_transparent_50%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto p-4 md:p-8 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
