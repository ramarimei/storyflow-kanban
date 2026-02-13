
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserStory, StoryStatus, User } from '../types';
import StoryCard from './StoryCard';
import { getEpicColor, getUniqueEpics } from '../utils/epicUtils';

interface BacklogViewProps {
  stories: UserStory[];
  onMoveStory: (id: string, newStatus: StoryStatus) => void;
  onDeleteStory: (id: string) => void;
  onEditStory?: (story: UserStory) => void;
  onAssignStory?: (id: string, userId: string | undefined) => void;
  users?: User[];
}

const BacklogView: React.FC<BacklogViewProps> = ({ 
  stories, 
  onMoveStory, 
  onDeleteStory,
  onEditStory,
  onAssignStory,
  users = []
}) => {
  const [epicFilter, setEpicFilter] = useState<string | null>(null);
  const isDark = document.body.classList.contains('theme-dark');
  const backlogStories = stories.filter(s => s.status === StoryStatus.BACKLOG);
  const filteredBacklogStories = backlogStories.filter(s => !epicFilter || s.epic === epicFilter);
  const allEpics = getUniqueEpics(backlogStories);

  const storyNumberMap = new Map<string, number>();
  stories.forEach((s, i) => storyNumberMap.set(s.id, i + 1));

  return (
    <div className="max-w-6xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b-2 border-blue-900 pb-6 gap-4">
        <div className="text-center sm:text-left">
          <h2 className="arcade-font text-[14px] text-yellow-400 tracking-widest flex items-center gap-4 justify-center sm:justify-start">
            <span className="text-2xl">🧊</span>
            PRODUCT BACKLOG
          </h2>
          <p className="text-slate-500 font-mono text-xs mt-2 uppercase">Items waiting for level refinement or future quest phases.</p>
        </div>
        
        <div className="bg-blue-900/20 border-2 border-blue-900 arcade-font text-yellow-400 px-6 py-3 rounded text-[10px] hidden md:block">
          {backlogStories.length} ITEMS DETECTED
        </div>
      </div>

      {allEpics.length > 0 && (
        <div className={`flex flex-wrap items-center gap-2 mb-6 p-3 rounded-lg border-2 ${
          isDark ? 'border-blue-900/40 bg-black/40' : 'border-slate-200 bg-white/60'
        }`}>
          <span className={`arcade-font text-[8px] uppercase tracking-wider mr-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Epics:</span>
          {allEpics.map(e => {
            const color = getEpicColor(e, isDark);
            const isActive = epicFilter === e;
            return (
              <button
                key={e}
                onClick={() => setEpicFilter(isActive ? null : e)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${color.bg} ${color.text} ${
                  isActive ? 'ring-2 ring-yellow-400 ring-offset-1 scale-105' : 'hover:scale-105'
                } ${isDark && isActive ? 'ring-offset-black' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                {e}
              </button>
            );
          })}
          {epicFilter && (
            <button
              onClick={() => setEpicFilter(null)}
              className={`arcade-font text-[8px] px-3 py-1 rounded-full transition-all ${
                isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-700 bg-slate-100'
              }`}
            >
              CLEAR
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBacklogStories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              storyNumber={storyNumberMap.get(story.id)}
              onMove={onMoveStory}
              onDelete={onDeleteStory}
              onEdit={onEditStory}
              onAssign={onAssignStory}
              allUsers={users}
              assignee={users.find(u => u.id === story.assigneeId)}
              viewMode="backlog"
            />
          ))}
        </AnimatePresence>

        {filteredBacklogStories.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 bg-blue-900/5 border-2 border-dashed border-blue-900/30 rounded-3xl flex flex-col items-center justify-center text-center px-6"
          >
            <div className="w-20 h-20 bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl opacity-40">🧊</span>
            </div>
            <h3 className="arcade-font text-[10px] text-slate-500 uppercase">Backlog is empty</h3>
            <p className="font-mono text-slate-700 text-xs max-w-xs mt-4 uppercase">Refine meeting notes or use the NEW STORY button above to populate the queue.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BacklogView;
