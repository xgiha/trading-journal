
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, User, Eye, EyeOff, Loader2, ArrowRight, UserCheck } from 'lucide-react';

const MotionDiv = motion.div as any;

interface LoginViewProps {
  onLogin: (mode: 'admin' | 'guest') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || status === 'checking') return;

    setStatus('checking');
    setErrorMsg('');

    // Simulated terminal authentication sequence
    setTimeout(() => {
      if (username === 'xgiha' && password === '#xgihaDagiya117') {
        setStatus('success');
        setTimeout(() => onLogin('admin'), 1000);
      } else {
        setStatus('error');
        setErrorMsg('ACCESS DENIED: INVALID CREDENTIALS');
        setTimeout(() => {
          setStatus('idle');
          setPassword('');
        }, 2000);
      }
    }, 1500);
  };

  const handleGuestLogin = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => onLogin('guest'), 800);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6 z-[1000] overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-xgiha-accent/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
      </div>

      <MotionDiv
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-[420px] flex flex-col items-center z-10"
      >
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-xgiha-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <MotionDiv key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500"><Shield size={28} fill="currentColor" /></MotionDiv>
              ) : status === 'error' ? (
                <MotionDiv key="error" initial={{ x: -5 }} animate={{ x: 0 }} className="text-red-500"><Lock size={28} /></MotionDiv>
              ) : (
                <MotionDiv key="idle"><Shield size={28} className="text-xgiha-accent" /></MotionDiv>
              )}
            </AnimatePresence>
          </div>
          <div className="text-center">
            <h1 className="font-pixel text-[10px] uppercase tracking-[0.5em] text-white/30 mb-2">Auth Protocol v2.5</h1>
            <p className="text-2xl font-bold text-white tracking-tight">System Access</p>
          </div>
        </div>

        <form onSubmit={handleAdminLogin} className="w-full space-y-4">
          <div className="space-y-3">
            {/* Username Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-xgiha-accent transition-colors">
                <User size={18} />
              </div>
              <input
                ref={userRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                disabled={status === 'checking' || status === 'success'}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-xgiha-accent/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-xgiha-accent transition-colors">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Access Secret"
                disabled={status === 'checking' || status === 'success'}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:outline-none focus:border-xgiha-accent/50 focus:bg-white/[0.05] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'checking' || status === 'success'}
            className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {status === 'checking' ? (
              <Loader2 size={18} className="animate-spin" />
            ) : status === 'success' ? (
              <span className="flex items-center gap-2">Success <ArrowRight size={14} /></span>
            ) : (
              "Initialize Link"
            )}
          </button>
        </form>

        <div className="w-full mt-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full text-white/10">
            <div className="h-px bg-current flex-1" />
            <span className="text-[9px] font-bold uppercase tracking-widest">or</span>
            <div className="h-px bg-current flex-1" />
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={status === 'checking' || status === 'success'}
            className="w-full py-4 rounded-2xl border border-white/5 bg-white/[0.02] text-xgiha-muted hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <UserCheck size={14} />
            Guest Terminal (View Only)
          </button>
        </div>

        {errorMsg && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-[10px] font-pixel text-red-500 tracking-wider text-center"
          >
            {errorMsg}
          </MotionDiv>
        )}
      </MotionDiv>
    </div>
  );
};