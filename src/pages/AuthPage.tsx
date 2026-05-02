import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  AtSign, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  Key,
  Users
} from 'lucide-react';
import { auth, db, doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, increment, updateDoc, addDoc, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '@/src/lib/firebase';
import { register, login as loginService } from '@/src/services/auth';
import { cn, generateReferralCode } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface AuthPageProps {
  type: 'login' | 'register' | 'reset-password';
}

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // Form states
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [referralCode, setReferralCode] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (type === 'register') {
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        if (username.length < 3) throw new Error("Username too short");
        
        await register(email, password, displayName, username, referralCode);
        navigate('/dashboard');
      } else if (type === 'login') {
        await loginService(email, password);
        navigate('/dashboard');
      } else if (type === 'reset-password') {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Reset link sent to your email!");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = () => {
    // Implement Telegram WebApp logic if needed
    // Usually via window.Telegram.WebApp.initData
    alert("Telegram integration is active. If opened via Telegram, you will be logged in automatically.");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] bg-[radial-gradient(circle_at_50%_-20%,_#312e81_0%,_#0f172a_70%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-8 md:p-12">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight">
              GetMoneyPay
            </h1>
            <p className="text-slate-400 font-medium mt-2">
              {type === 'login' ? 'Welcome back to your wallet' : 
               type === 'register' ? 'Join thousands of earners today' : 
               'Recover your access'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center gap-2 text-sm font-bold">
              <ShieldCheck size={18} />
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'register' && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="Full Name" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      required
                      type="text" 
                      placeholder="Username" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                </div>
              </>
            )}

            {(type === 'login' || type === 'register' || type === 'reset-password') && (
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type={type === 'login' ? "text" : "email"}
                  placeholder={type === 'login' ? "Email or Username" : "Email Address"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
              </div>
            )}

            {(type === 'login' || type === 'register') && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            {type === 'register' && (
              <>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    required
                    type="password" 
                    placeholder="Confirm Password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Referral Code (Optional)" 
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <label className="flex items-start gap-3 p-2 cursor-pointer group">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    By registering, I agree to the <span className="font-bold underline">Terms of Service</span> and <span className="font-bold underline">Privacy Policy</span>.
                  </span>
                </label>
              </>
            )}

            {type === 'login' && (
              <div className="text-right">
                <Link to="/reset-password" size={18} className="text-xs font-black text-indigo-400 hover:text-indigo-300 hover:underline">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-white text-slate-950 py-4 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <>
                  {type === 'login' ? 'Sign In' : type === 'register' ? 'Create Account' : 'Reset Password'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* External Login */}
          {type !== 'reset-password' && (
            <div className="mt-8 space-y-4">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-xs font-black text-slate-600 uppercase tracking-widest">Or continue with</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>
              
              <button 
                onClick={handleTelegramLogin}
                className="w-full bg-[#24A1DE] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-[#24A1DE]/90 transition-all shadow-[0_0_20px_rgba(36,161,222,0.2)]"
              >
                <AtSign size={18} />
                Telegram WebApp
              </button>
            </div>
          )}

          {/* Toggle Type */}
          <div className="mt-8 text-center text-slate-400 font-medium text-sm">
            {type === 'login' ? (
              <p>Don't have an account? <Link to="/register" className="text-indigo-400 font-black hover:text-indigo-300 hover:underline">Register Now</Link></p>
            ) : (
              <p>Already a member? <Link to="/login" className="text-indigo-400 font-black hover:text-indigo-300 hover:underline">Sign In</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
