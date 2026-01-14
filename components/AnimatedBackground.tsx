
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  const isDark = document.body.classList.contains('theme-dark');

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-500 ${isDark ? 'bg-black' : 'bg-[#f0f0ff]'}`}>
      {/* Maze Dots Grid */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-20' : 'opacity-10'}`}
        style={{ 
          backgroundImage: `radial-gradient(${isDark ? '#fff' : '#2121ff'} 2px, transparent 2px)`, 
          backgroundSize: '60px 60px' 
        }}
      />
      
      {/* Animated Maze Walls (Blue Glows) */}
      <div className={`absolute inset-0 flex flex-col justify-around py-20 ${isDark ? 'opacity-10' : 'opacity-5'}`}>
        {[1, 2, 3, 4].map((i) => (
          <motion.div 
            key={i}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`h-2 w-full transition-colors ${isDark ? 'bg-blue-600 shadow-[0_0_20px_blue]' : 'bg-[#2121ff]'}`}
          />
        ))}
      </div>

      {/* Wandering Ghost (Easter Egg) */}
      <motion.div
        animate={{ 
          x: ['-10%', '110%'],
          y: ['20%', '25%', '20%']
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className={`absolute top-20 text-4xl opacity-10 filter blur-[1px] ${!isDark && 'grayscale brightness-50'}`}
      >
        👻
      </motion.div>
    </div>
  );
};

export default AnimatedBackground;

