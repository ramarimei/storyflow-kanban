
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../types';

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
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].url);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-500 ${isDarkTheme ? 'bg-black' : 'bg-[#f0f0ff]'}`}>
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`max-w-md w-full p-10 maze-border text-center ${isDarkTheme ? 'bg-black' : 'bg-white'}`}
      >
        <h2 className={`arcade-font text-xl mb-8 animate-pulse ${isDarkTheme ? 'text-yellow-400' : 'text-[#2121ff]'}`}>PLAYER SELECT</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!name) return;
          onLogin({ id: Math.random().toString(36).substr(2, 9), name, avatar: selectedAvatar, color: 'bg-yellow-400', role: 'Player 1' });
        }} className="space-y-8">
          <input 
            required
            autoFocus
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="ENTER INITIALS"
            className={`w-full border-4 arcade-font text-center text-lg p-4 outline-none transition-all ${isDarkTheme ? 'bg-black border-blue-600 text-white focus:border-yellow-400' : 'bg-white border-[#2121ff] text-[#000033] focus:border-yellow-500'}`}
            maxLength={10}
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

          <button 
            type="submit"
            className={`w-full py-5 arcade-font transition-all ${isDarkTheme ? 'bg-blue-600 text-white hover:bg-yellow-400 hover:text-black' : 'bg-[#2121ff] text-white hover:bg-yellow-400 hover:text-black shadow-lg shadow-blue-500/20'}`}
          >
            START GAME
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
