
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserStory, StoryStatus, User } from '../types';
import StoryCard from './StoryCard';

interface KanbanBoardProps {
  stories: UserStory[];
  onMoveStory: (id: string, newStatus: StoryStatus) => void;
  onDeleteStory: (id: string) => void;
  onEditStory?: (story: UserStory) => void;
  onAssignStory?: (id: string, userId: string | undefined) => void;
  isDarkTheme?: boolean;
  users?: User[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  stories, 
  onMoveStory, 
  onDeleteStory, 
  onEditStory,
  onAssignStory,
  users = []
}) => {
  const isPacman = document.body.classList.contains('mode-pacman');
  const isDark = document.body.classList.contains('theme-dark');

  const columns = [
    { id: StoryStatus.TODO, title: 'TO DO', color: isDark ? 'text-white' : 'text-[#2121ff]' },
    { id: StoryStatus.IN_PROGRESS, title: 'IN PROGRESS', color: isDark ? 'text-yellow-400' : 'text-amber-600' },
    { id: StoryStatus.BLOCKED, title: 'BLOCKED', color: isDark ? 'text-red-500' : 'text-red-700' },
    { id: StoryStatus.TESTING, title: 'TESTING', color: isDark ? 'text-cyan-400' : 'text-blue-700' },
    { id: StoryStatus.DONE, title: 'DONE', color: isDark ? 'text-green-500' : 'text-green-700' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 h-full min-h-[70vh]">
      {columns.map((column) => {
        const colStories = stories.filter(s => s.status === column.id);
        
        return (
          <div 
            key={column.id} 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData('storyId');
              if (id) onMoveStory(id, column.id);
            }}
            className={`flex flex-col rounded-xl overflow-hidden h-full border-2 p-4 transition-all duration-300 ${
              isDark 
                ? 'border-blue-900/40 bg-black/40' 
                : (isPacman ? 'border-[#2121ff] bg-white shadow-[0_4px_10px_rgba(33,33,255,0.05)]' : 'border-slate-300 bg-white shadow-sm')
            }`}
          >
            <h2 className={`arcade-font text-[10px] text-center mb-6 py-2 border-b-2 ${
              isDark ? 'border-blue-900/20' : (isPacman ? 'border-[#2121ff]/20' : 'border-slate-100')
            } ${column.color}`}>
              {column.title}
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-1 custom-scrollbar min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {colStories.map(story => (
                  <StoryCard 
                    key={story.id} 
                    story={story} 
                    onMove={onMoveStory} 
                    onDelete={onDeleteStory}
                    onEdit={onEditStory}
                    onAssign={onAssignStory}
                    allUsers={users}
                    assignee={users.find(u => u.id === story.assigneeId)}
                  />
                ))}
              </AnimatePresence>
              
              {colStories.length === 0 && (
                <div className={`border-2 border-dashed rounded-lg p-10 text-center arcade-font text-[8px] uppercase ${
                  isDark ? 'border-blue-900/30 text-slate-700' : (isPacman ? 'border-[#2121ff]/10 text-slate-300' : 'border-slate-200 text-slate-300')
                }`}>
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
