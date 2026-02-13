
import React from 'react';
import { motion } from 'framer-motion';
import { UserStory, StoryStatus, StoryPriority, StoryType, User } from '../types';
import { getEpicColor } from '../utils/epicUtils';

interface StoryCardProps {
  story: UserStory;
  storyNumber?: number;
  onMove: (id: string, newStatus: StoryStatus) => void;
  onDelete: (id: string) => void;
  onEdit?: (story: UserStory) => void;
  onAssign?: (id: string, userId: string | undefined) => void;
  viewMode?: 'board' | 'backlog';
  assignee?: User;
  allUsers?: User[];
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  storyNumber,
  onDelete,
  onEdit,
  assignee
}) => {
  const isPacman = document.body.classList.contains('mode-pacman');
  const isDark = document.body.classList.contains('theme-dark');
  const isBug = story.type === StoryType.BUG;
  const isBlocked = story.status === StoryStatus.BLOCKED;

  const priorityColors = {
    [StoryPriority.LOW]: isDark ? 'text-cyan-400' : 'text-cyan-700',
    [StoryPriority.MEDIUM]: isDark ? 'text-yellow-400' : 'text-amber-700',
    [StoryPriority.HIGH]: isDark ? 'text-red-500' : 'text-red-700',
  };

  const statusIcons = {
    [StoryStatus.DONE]: '🍒',
    [StoryStatus.BLOCKED]: '👻',
    [StoryStatus.IN_PROGRESS]: '⚡',
    [StoryStatus.TODO]: '🟡',
    [StoryStatus.TESTING]: '🍎',
    [StoryStatus.BACKLOG]: '🧊',
  };

  const acTotal = story.acceptanceCriteria?.length || 0;
  const acCompleted = story.acceptanceCriteria?.filter(ac => ac.completed).length || 0;
  const progressPercent = acTotal > 0 ? (acCompleted / acTotal) * 100 : 0;

  // Mode/Theme specific styles
  const cardBg = isDark ? 'bg-black' : 'bg-white';
  const borderColor = isDark 
    ? (isBlocked ? 'border-red-500' : 'border-blue-900/50') 
    : (isPacman ? (isBlocked ? 'border-red-500' : 'border-[#2121ff]') : (isBlocked ? 'border-red-300' : 'border-slate-200'));
  
  const shadowStyle = isDark 
    ? (isBlocked ? 'shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'shadow-md') 
    : (isPacman ? (isBlocked ? 'shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'shadow-[4px_4px_0px_rgba(33,33,255,0.1)]') : 'shadow-sm shadow-blue-500/5');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      onClick={() => onEdit?.(story)}
      draggable="true"
      onDragStart={(e: any) => {
        if (e.dataTransfer) {
          e.dataTransfer.setData('storyId', story.id);
        }
      }}
      className={`relative p-5 border-2 rounded-xl cursor-grab active:cursor-grabbing transition-all ${cardBg} ${borderColor} ${shadowStyle}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {storyNumber && (
              <span className={`arcade-font text-[8px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                #{storyNumber}
              </span>
            )}
            <span className={`arcade-font text-[8px] uppercase tracking-tighter ${priorityColors[story.priority]}`}>
              {story.priority} PRIORITY
            </span>
          </div>
          {story.epic && (() => {
            const epicColor = getEpicColor(story.epic, isDark);
            return (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 w-fit ${epicColor.bg} ${epicColor.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${epicColor.dot}`} />
                {story.epic}
              </span>
            );
          })()}
          <h3 className={`font-bold text-sm mt-1 ${isBug ? 'text-red-500' : (isDark ? 'text-white' : 'text-[#000033]')}`}>
            {story.title}
          </h3>
        </div>
        <div className={`text-xl ${isPacman && isDark ? 'filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : ''}`}>
          {statusIcons[story.status]}
        </div>
      </div>
      
      <p className={`text-[12px] line-clamp-2 mb-4 leading-relaxed ${isDark ? 'text-slate-400 font-mono' : 'text-slate-600 font-sans'}`}>
        {story.description}
      </p>

      {/* Progress Bar */}
      {acTotal > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Progress</span>
             <span className="text-[10px] text-slate-400">{acCompleted}/{acTotal}</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-blue-950' : 'bg-slate-100'}`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full transition-colors duration-500 ${
                progressPercent === 100 
                  ? (isDark ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-green-500') 
                  : (isDark ? 'bg-yellow-400 shadow-[0_0_10px_#facc15]' : (isPacman ? 'bg-[#2121ff]' : 'bg-blue-500'))
              }`}
            />
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2">
          {assignee ? (
            <div className="flex items-center gap-2 group">
              <img src={assignee.avatar} className="w-7 h-7 rounded-lg border border-blue-500/20 shadow-sm" alt="" />
              <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'}`}>{assignee.name}</span>
            </div>
          ) : (
             <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[8px] arcade-font ${isDark ? 'bg-slate-900 border-slate-800 text-slate-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>?</div>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          {story.points && <span className={`arcade-font text-[8px] ${isDark ? 'text-cyan-400' : 'text-blue-800'}`}>{story.points} XP</span>}
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(story.id); }}
            className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-slate-800 hover:text-red-500' : 'text-slate-300 hover:text-red-600'}`}
          >
            Del
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StoryCard;
