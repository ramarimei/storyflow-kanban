import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserStory, StoryStatus, StoryPriority, StoryType, User, AcceptanceCriterion } from '../types';
import { getEpicColor, getUniqueEpics } from '../utils/epicUtils';

interface EditStoryModalProps {
  story: UserStory;
  users: User[];
  currentUser: User;
  isDarkTheme: boolean;
  allStories: UserStory[];
  onClose: () => void;
  onSave: (story: UserStory) => void;
}

const EditStoryModal: React.FC<EditStoryModalProps> = ({
  story,
  users,
  currentUser,
  isDarkTheme,
  allStories,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(story.title);
  const [description, setDescription] = useState(story.description);
  const [status, setStatus] = useState(story.status);
  const [priority, setPriority] = useState(story.priority);
  const [points, setPoints] = useState(story.points || 5);
  const [assigneeId, setAssigneeId] = useState(story.assigneeId || '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<AcceptanceCriterion[]>(
    story.acceptanceCriteria || []
  );
  const [epic, setEpic] = useState(story.epic || '');
  const [showEpicSuggestions, setShowEpicSuggestions] = useState(false);
  const [newCriterion, setNewCriterion] = useState('');

  const isPacman = typeof document !== 'undefined' && document.body.classList.contains('mode-pacman');
  const descRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => { autoResize(); }, [description, autoResize]);

  const handleSave = () => {
    onSave({
      ...story,
      title,
      description,
      status,
      priority,
      points,
      assigneeId: assigneeId || undefined,
      acceptanceCriteria,
      epic: epic.trim() || null,
    });
  };

  const addCriterion = () => {
    if (!newCriterion.trim()) return;
    setAcceptanceCriteria([
      ...acceptanceCriteria,
      { id: Math.random().toString(36).substr(2, 9), text: newCriterion, completed: false },
    ]);
    setNewCriterion('');
  };

  const toggleCriterion = (id: string) => {
    setAcceptanceCriteria(
      acceptanceCriteria.map((ac) =>
        ac.id === id ? { ...ac, completed: !ac.completed } : ac
      )
    );
  };

  const removeCriterion = (id: string) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((ac) => ac.id !== id));
  };

  const inputClass = `w-full border-2 p-3 outline-none transition-all rounded ${
    isDarkTheme
      ? 'bg-black/50 border-blue-900 text-white focus:border-yellow-400'
      : 'bg-white border-slate-300 text-slate-800 focus:border-[#2121ff]'
  }`;

  const labelClass = `arcade-font text-[8px] uppercase tracking-wider mb-2 block ${
    isDarkTheme ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`maze-border w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 ${
          isDarkTheme ? 'bg-black' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className={`arcade-font text-[14px] uppercase ${isDarkTheme ? 'text-yellow-400' : 'text-[#2121ff]'}`}>
            {story.type === StoryType.BUG ? 'Edit Bug' : 'Edit Story'}
          </h2>
          <button
            onClick={onClose}
            className={`arcade-font text-[14px] hover:text-red-500 ${!isDarkTheme && 'text-slate-400'}`}
          >
            X
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="Story title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onInput={autoResize}
              className={`${inputClass} min-h-[100px]`}
              placeholder="Describe the story..."
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoryStatus)}
                className={inputClass}
              >
                {Object.values(StoryStatus).map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as StoryPriority)}
                className={inputClass}
              >
                {Object.values(StoryPriority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Points & Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Points (XP)</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className={inputClass}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className={labelClass}>Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Epic */}
          <div className="relative">
            <label className={labelClass}>Epic / Feature Group</label>
            <input
              type="text"
              value={epic}
              onChange={(e) => { setEpic(e.target.value); setShowEpicSuggestions(true); }}
              onFocus={() => setShowEpicSuggestions(true)}
              onBlur={() => setTimeout(() => setShowEpicSuggestions(false), 150)}
              className={inputClass}
              placeholder="e.g. Outreach & Adoption"
            />
            {showEpicSuggestions && (() => {
              const existingEpics = getUniqueEpics(allStories).filter(
                e => e.toLowerCase().includes(epic.toLowerCase()) && e !== epic
              );
              if (existingEpics.length === 0) return null;
              return (
                <div className={`absolute z-10 w-full mt-1 border-2 rounded max-h-40 overflow-y-auto ${
                  isDarkTheme ? 'bg-black border-blue-900' : 'bg-white border-slate-300 shadow-lg'
                }`}>
                  {existingEpics.map(e => {
                    const color = getEpicColor(e, isDarkTheme);
                    return (
                      <button
                        key={e}
                        type="button"
                        onMouseDown={() => { setEpic(e); setShowEpicSuggestions(false); }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                          isDarkTheme ? 'hover:bg-blue-900/30 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                        {e}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Acceptance Criteria */}
          <div>
            <label className={labelClass}>Acceptance Criteria</label>
            <div className="space-y-2 mb-3">
              {acceptanceCriteria.map((ac) => (
                <div
                  key={ac.id}
                  className={`flex items-center gap-3 p-3 rounded border ${
                    isDarkTheme ? 'border-blue-900/50 bg-blue-900/10' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => toggleCriterion(ac.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      ac.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : isDarkTheme
                        ? 'border-blue-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {ac.completed && '✓'}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      ac.completed ? 'line-through opacity-50' : ''
                    } ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {ac.text}
                  </span>
                  <button
                    onClick={() => removeCriterion(ac.id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                className={`${inputClass} flex-1`}
                placeholder="Add acceptance criterion..."
              />
              <button
                onClick={addCriterion}
                className={`px-4 arcade-font text-[10px] rounded transition-all ${
                  isDarkTheme
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-[#2121ff] text-white hover:bg-blue-600'
                }`}
              >
                ADD
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-blue-900/20">
            <button
              onClick={onClose}
              className={`flex-1 py-4 arcade-font text-[10px] rounded transition-all ${
                isDarkTheme
                  ? 'border-2 border-slate-700 text-slate-400 hover:border-slate-500'
                  : 'border-2 border-slate-300 text-slate-500 hover:border-slate-400'
              }`}
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 py-4 arcade-font text-[10px] rounded transition-all ${
                isDarkTheme
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-[#2121ff] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20'
              }`}
            >
              SAVE CHANGES
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EditStoryModal;
