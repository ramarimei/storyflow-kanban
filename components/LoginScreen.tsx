import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';
import { supabase } from '../services/supabaseService';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  isDarkTheme: boolean;
}

const AVATARS = [
  { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Blinky', name: 'BLINKY' },
  { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pinky', name: 'PINKY' },
  { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Inky', name: 'INKY' },
  { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Clyde', name: 'CLYDE' },
  { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Pac', name: 'PAC-MAN' },
];

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isDarkTheme }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].url);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!supabase) {
      setError('Database connection not configured');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.toUpperCase(),
              avatar_url: selectedAvatar,
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setMessage('Check your email to confirm your account!');
        } else if (data.user && data.session) {
          onLogin({
            id: data.user.id,
            name: displayName.toUpperCase() || email.split('@')[0].toUpperCase(),
            avatar: selectedAvatar,
            color: 'bg-yellow-400',
            role: 'Team Member'
          });
        }
      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const metadata = data.user.user_metadata;
          onLogin({
            id: data.user.id,
            name: metadata?.display_name || email.split('@')[0].toUpperCase(),
            avatar: metadata?.avatar_url || AVATARS[0].url,
            color: 'bg-yellow-400',
            role: 'Team Member'
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-500 ${isDarkTheme ? 'bg-black' : 'bg-[#f0f0ff]'}`}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`max-w-md w-full p-10 maze-border text-center ${isDarkTheme ? 'bg-black' : 'bg-white'}`}
      >
        <h2 className={`arcade-font text-xl mb-2 animate-pulse ${isDarkTheme ? 'text-yellow-400' : 'text-[#2121ff]'}`}>
          PLAYER LOGIN
        </h2>
        <p className={`text-xs mb-4 ${isDarkTheme ? 'text-slate-500' : 'text-slate-400'}`}>
          Sign in to continue
        </p>
        <div className={`text-xs mb-6 p-3 rounded border ${isDarkTheme ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
          Invite only - contact for access
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded text-green-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <>
              <input
                required
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.toUpperCase())}
                placeholder="DISPLAY NAME"
                className={`w-full border-2 arcade-font text-center text-sm p-4 outline-none transition-all ${isDarkTheme ? 'bg-black border-blue-600 text-white focus:border-yellow-400' : 'bg-white border-[#2121ff] text-[#000033] focus:border-yellow-500'}`}
                maxLength={15}
              />

              <div className="grid grid-cols-5 gap-3">
                {AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.url)}
                    className={`p-1 rounded-lg transition-all border-2 ${selectedAvatar === avatar.url ? (isDarkTheme ? 'border-yellow-400 scale-110' : 'border-[#2121ff] scale-110') : 'border-transparent opacity-50'}`}
                  >
                    <img src={avatar.url} className={`w-full h-full rounded ${isDarkTheme ? 'bg-slate-900' : 'bg-slate-100'}`} alt="" />
                  </button>
                ))}
              </div>
            </>
          )}

          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="EMAIL"
            className={`w-full border-2 text-center text-sm p-4 outline-none transition-all ${isDarkTheme ? 'bg-black border-blue-600 text-white focus:border-yellow-400' : 'bg-white border-[#2121ff] text-[#000033] focus:border-yellow-500'}`}
          />

          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            minLength={6}
            className={`w-full border-2 text-center text-sm p-4 outline-none transition-all ${isDarkTheme ? 'bg-black border-blue-600 text-white focus:border-yellow-400' : 'bg-white border-[#2121ff] text-[#000033] focus:border-yellow-500'}`}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 arcade-font transition-all disabled:opacity-50 ${isDarkTheme ? 'bg-blue-600 text-white hover:bg-yellow-400 hover:text-black' : 'bg-[#2121ff] text-white hover:bg-yellow-400 hover:text-black shadow-lg shadow-blue-500/20'}`}
          >
            {loading ? 'LOADING...' : (isSignUp ? 'CREATE ACCOUNT' : 'START GAME')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
          className={`mt-4 text-xs underline transition-colors ${isDarkTheme ? 'text-slate-500 hover:text-yellow-400' : 'text-slate-400 hover:text-[#2121ff]'}`}
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>

      </motion.div>
    </div>
  );
};

export default LoginScreen;
