import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, auth } from '../firebase';
import { LogIn, Layout as LayoutIcon, UserPlus, Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
            <LayoutIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-light tracking-tighter">CollabTask</h1>
          <p className="text-white/60 font-light tracking-wide uppercase text-xs">
            Production-grade task management
          </p>
        </div>

        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-6 text-left backdrop-blur-sm">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-light tracking-tight italic serif">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">
              {isSignUp ? 'Join the production team' : 'Access your workspace'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl outline-none focus:ring-2 ring-white/20 transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl outline-none focus:ring-2 ring-white/20 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-widest opacity-40 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 p-3 pl-12 rounded-xl outline-none focus:ring-2 ring-white/20 transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center bg-red-400/10 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 px-6 rounded-full bg-white text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span className="text-sm font-bold tracking-widest uppercase">
                    {isSignUp ? 'Sign Up' : 'Login'}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Version</p>
          <p className="text-xs font-mono">2.4.0-BETA</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Status</p>
          <p className="text-xs font-mono text-emerald-500">SYSTEMS OPERATIONAL</p>
        </div>
      </div>
    </div>
  );
}
