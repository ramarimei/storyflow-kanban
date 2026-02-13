import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as mammoth from 'mammoth';
import { UserStory, StoryStatus, StoryPriority, StoryType, AppMode, AppTheme, User } from './types';
import KanbanBoard from './components/KanbanBoard';
import BacklogView from './components/BacklogView';
import AnimatedBackground from './components/AnimatedBackground';
import LoginScreen from './components/LoginScreen';
import EditStoryModal from './components/EditStoryModal';
import { parseStoriesFromText, generateStandupSummary, generateMeetingScript } from './services/geminiService';
import { supabaseService, supabase } from './services/supabaseService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  // Check for existing session on load
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setCurrentUser({
          id: session.user.id,
          name: metadata?.display_name || session.user.email?.split('@')[0].toUpperCase() || 'PLAYER',
          avatar: metadata?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Default',
          color: 'bg-yellow-400',
          role: 'Team Member'
        });
      }
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setCurrentUser({
          id: session.user.id,
          name: metadata?.display_name || session.user.email?.split('@')[0].toUpperCase() || 'PLAYER',
          avatar: metadata?.avatar_url || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Default',
          color: 'bg-yellow-400',
          role: 'Team Member'
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setCurrentUser(null);
    }
  };

  const [projectName, setProjectName] = useState('NEXUS-PROJECT-ALPHA');
  const [stories, setStories] = useState<UserStory[]>([]);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [viewMode, setViewMode] = useState<'BOARD' | 'BACKLOG'>('BOARD');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<string | null>(null);
  const [meetingScript, setMeetingScript] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalText, setTerminalText] = useState('');

  const [appMode, setAppMode] = useState<AppMode>(() => 
    (localStorage.getItem('storyflow_mode') as AppMode) || AppMode.PACMAN
  );
  const [appTheme, setAppTheme] = useState<AppTheme>(() => 
    (localStorage.getItem('storyflow_theme') as AppTheme) || AppTheme.DARK
  );

  const isPacman = appMode === AppMode.PACMAN;
  const isDark = appTheme === AppTheme.DARK;

  useEffect(() => {
    document.body.className = `theme-${appTheme.toLowerCase()} mode-${appMode.toLowerCase()}`;
    localStorage.setItem('storyflow_mode', appMode);
    localStorage.setItem('storyflow_theme', appTheme);
  }, [appMode, appTheme]);

  const allAvailableUsers = useMemo(() => {
    if (!currentUser) return teamMembers;
    const exists = teamMembers.find(u => u.id === currentUser.id);
    return exists ? teamMembers : [currentUser, ...teamMembers];
  }, [currentUser, teamMembers]);

  const refreshData = useCallback(async () => {
    if (!supabase) {
      const saved = localStorage.getItem(`storyflow_stories_${projectName}`);
      if (saved) setStories(JSON.parse(saved));
      return;
    }
    const data = await supabaseService.getStories(projectName);
    setStories(data);
  }, [projectName]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleCreateStory = (type: StoryType = StoryType.STORY) => {
    const defaultStatus = viewMode === 'BOARD' ? StoryStatus.TODO : StoryStatus.BACKLOG;
    const newStory: UserStory = {
      id: Math.random().toString(36).substr(2, 9),
      title: type === StoryType.BUG ? 'NEW BUG DETECTED' : 'NEW PROJECT QUEST',
      description: '',
      status: defaultStatus,
      priority: type === StoryType.BUG ? StoryPriority.HIGH : StoryPriority.MEDIUM,
      type: type,
      createdAt: Date.now(),
      comments: [],
      acceptanceCriteria: [],
      points: 5
    };
    setEditingStory(newStory);
  };

  const processTextImport = async (text: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setProcessingStep('CONNECTING TO NANO TERMINAL...');
    
    try {
      setTimeout(() => setProcessingStep('AI: EXTRACTING STORIES...'), 800);
      const geminiResult = await parseStoriesFromText(text);
      
      const importedStories: UserStory[] = geminiResult.stories.map(s => ({
        ...s,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: Date.now(),
        assigneeId: undefined,
        comments: [],
        acceptanceCriteria: s.acceptanceCriteria?.map(ac => ({ ...ac, id: Math.random().toString(36).substr(2, 9) })) || []
      }));
      
      for (const s of importedStories) {
        await supabaseService.upsertStory(s, projectName);
      }
      
      setStories(prev => [...prev, ...importedStories]);
      setShowTerminal(false);
      setTerminalText('');
    } catch (e) {
      console.error(e);
      alert("AI PARSE ERROR!");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStep(`READING ${files.length} DOCX FILE(S)...`);
    
    try {
      let combinedText = '';
      for (let i = 0; i < files.length; i++) {
        const arrayBuffer = await files[i].arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        combinedText += `\n--- SOURCE: ${files[i].name} ---\n` + result.value;
      }
      await processTextImport(combinedText);
    } catch (error) {
      alert("FILE UPLOAD ERROR!");
      setIsProcessing(false);
    }
  };

  const stats = {
    score: stories.reduce((acc, s) => acc + (s.status === StoryStatus.DONE ? (s.points || 10) : 0), 0),
    credits: stories.length,
    ghosts: stories.filter(s => s.status === StoryStatus.BLOCKED).length
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[#f0f0ff]'}`}>
        <div className={`arcade-font text-xl animate-pulse ${isDark ? 'text-yellow-400' : 'text-[#2121ff]'}`}>
          LOADING...
        </div>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} isDarkTheme={isDark} />;

  return (
    <div className={`min-h-screen transition-all duration-500 ${isDark ? 'bg-black text-white' : 'bg-[#f8f9ff] text-slate-900'} relative flex flex-col font-mono`}>
      {isPacman && <div className="scanlines"></div>}
      {isPacman && <AnimatedBackground />}

      <header className={`sticky top-0 z-40 backdrop-blur-md border-b-4 transition-all duration-500 ${isDark ? 'bg-black/95 border-blue-900 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' : 'bg-white/95 border-[#2121ff] shadow-lg shadow-blue-500/10'} px-8 py-4 flex flex-col lg:flex-row justify-between items-center gap-6`}>
        <div className="flex gap-10 arcade-font items-center">
          <div className="flex flex-col items-center">
            <span className={`text-[9px] uppercase tracking-widest mb-1 ${isDark ? 'text-red-500' : 'text-red-600'}`}>Project Score</span>
            <span className={`text-xl tracking-tighter ${isDark ? 'neon-text-blue text-white' : 'text-[#2121ff]'}`}>{stats.score.toString().padStart(6, '0')}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className={`text-[9px] uppercase tracking-widest mb-1 ${isDark ? 'text-pink-500' : 'text-pink-700'}`}>Blocked</span>
            <span className={`text-xl tracking-tighter ${isDark ? 'text-pink-500' : 'text-pink-700'}`}>{stats.ghosts}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4">
          <div className={`flex p-1 rounded-lg transition-all ${isDark ? 'bg-blue-900/10 border-2 border-blue-900/40' : 'bg-white border-2 border-[#2121ff]/20 shadow-sm'}`}>
            <button onClick={() => handleCreateStory(StoryType.STORY)} className={`arcade-font text-[9px] px-4 py-3 transition-all active:scale-95 uppercase ${isDark ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-yellow-400 text-yellow-950 hover:bg-yellow-300'}`}>
              ADD STORY +
            </button>
            <button onClick={() => handleCreateStory(StoryType.BUG)} className="arcade-font text-[9px] px-4 py-3 bg-red-600 text-white hover:bg-red-500 transition-all active:scale-95 uppercase ml-1">
              ADD BUG +
            </button>
          </div>

          <div className={`flex items-center gap-2 p-1 rounded-lg transition-all ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-[#2121ff]/10 shadow-sm'}`}>
            <button onClick={() => setAppMode(isPacman ? AppMode.PROFESSIONAL : AppMode.PACMAN)} className="p-2 rounded hover:bg-blue-500/10 transition-colors text-lg" title="Toggle Mode">
              {isPacman ? '🕹️' : '💼'}
            </button>
            <button onClick={() => setAppTheme(isDark ? AppTheme.LIGHT : AppTheme.DARK)} className="p-2 rounded hover:bg-blue-500/10 transition-colors text-lg" title="Toggle Theme">
              {isDark ? '🌙' : '☀️'}
            </button>
          </div>

          <div className={`flex p-1 rounded-lg transition-all ${isDark ? 'bg-blue-900/20 border-2 border-blue-900' : 'bg-[#2121ff]/5 border-2 border-[#2121ff]/20'}`}>
            <button onClick={() => setViewMode('BOARD')} className={`px-5 py-2 arcade-font text-[9px] transition-all rounded ${viewMode === 'BOARD' ? (isDark ? 'bg-blue-600 text-white' : 'bg-[#2121ff] text-white') : (isDark ? 'text-blue-900' : 'text-blue-300 hover:text-[#2121ff]')}`}>BOARD</button>
            <button onClick={() => setViewMode('BACKLOG')} className={`px-5 py-2 arcade-font text-[9px] transition-all rounded ${viewMode === 'BACKLOG' ? (isDark ? 'bg-blue-600 text-white' : 'bg-[#2121ff] text-white') : (isDark ? 'text-blue-900' : 'text-blue-300 hover:text-[#2121ff]')}`}>BACKLOG</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowTerminal(true)} className={`arcade-font text-[9px] border-2 px-4 py-3 transition-all active:scale-95 ${isDark ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black' : 'border-[#2121ff] text-[#2121ff] hover:bg-[#2121ff] hover:text-white'}`}>
            IMPORT
          </button>
          <button 
            onClick={async () => {
              setIsGeneratingSummary(true);
              const script = await generateMeetingScript(stories, projectName);
              setMeetingScript(script);
              setIsGeneratingSummary(false);
            }}
            className={`arcade-font text-[9px] border-2 px-4 py-3 transition-all active:scale-95 ${isDark ? 'border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
          >
            {isGeneratingSummary ? 'PARSING...' : 'PRESENT'}
          </button>
          <div className={`flex items-center gap-3 border-l pl-4 ${isDark ? 'border-blue-900' : 'border-[#2121ff]/10'}`}>
             <img src={currentUser.avatar} className={`w-9 h-9 rounded border-2 ${isDark ? 'border-blue-600' : 'border-[#2121ff]'}`} alt="User Avatar" />
          </div>
          <button
            onClick={handleLogout}
            className="arcade-font text-[12px] px-6 py-3 bg-red-600 text-white rounded ml-4"
          >
            LOGOUT ({currentUser.name})
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 relative z-10 w-full max-w-[1800px] mx-auto">
        {viewMode === 'BOARD' ? (
          <KanbanBoard 
            stories={stories} 
            onMoveStory={async (id, status) => {
              const story = stories.find(s => s.id === id);
              if (story) {
                const updated = { ...story, status };
                setStories(prev => prev.map(s => s.id === id ? updated : s));
                await supabaseService.upsertStory(updated, projectName);
              }
            }} 
            onDeleteStory={async id => {
              setStories(prev => prev.filter(s => s.id !== id));
              await supabaseService.deleteStory(id);
            }} 
            onEditStory={setEditingStory} 
            onAssignStory={async (id, userId) => {
              const story = stories.find(s => s.id === id);
              if (story) {
                const updated = { ...story, assigneeId: userId };
                setStories(prev => prev.map(s => s.id === id ? updated : s));
                await supabaseService.upsertStory(updated, projectName);
              }
            }}
            users={allAvailableUsers}
          />
        ) : (
          <BacklogView 
            stories={stories}
            onMoveStory={async (id, status) => {
              const story = stories.find(s => s.id === id);
              if (story) {
                const updated = { ...story, status };
                setStories(prev => prev.map(s => s.id === id ? updated : s));
                await supabaseService.upsertStory(updated, projectName);
              }
            }}
            onDeleteStory={async id => {
              setStories(prev => prev.filter(s => s.id !== id));
              await supabaseService.deleteStory(id);
            }}
            onEditStory={setEditingStory}
            users={allAvailableUsers}
          />
        )}
      </main>

      <AnimatePresence>
        {showTerminal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`maze-border w-full max-w-4xl p-10 flex flex-col h-[75vh] ${isDark ? 'bg-black' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className={`arcade-font text-[14px] tracking-widest uppercase ${isDark ? 'text-blue-400' : 'text-[#2121ff]'}`}>Story Importer</div>
                <button onClick={() => setShowTerminal(false)} className={`arcade-font text-[14px] hover:text-red-500 ${!isDark && 'text-slate-400'}`}>X</button>
              </div>
              <textarea className={`flex-1 border-2 p-6 font-mono outline-none rounded-lg text-sm leading-relaxed ${isDark ? 'bg-black/50 border-blue-900 text-cyan-400' : 'bg-slate-50 border-slate-300 text-slate-800'}`} value={terminalText} onChange={e => setTerminalText(e.target.value)} placeholder="Paste notes or stories here..." />
              <div className="flex justify-between items-center gap-6 pt-6">
                <label className="cursor-pointer group flex items-center gap-3">
                  <div className={`w-10 h-10 border-2 rounded flex items-center justify-center ${isDark ? 'border-blue-900' : 'border-slate-300'}`}>📄</div>
                  <span className={`arcade-font text-[8px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Upload .docx</span>
                  <input type="file" className="hidden" accept=".docx" multiple onChange={handleFileUpload} />
                </label>
                <button onClick={() => processTextImport(terminalText)} disabled={!terminalText.trim() || isProcessing} className={`arcade-font text-[12px] px-8 py-4 ${isDark ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-[#2121ff] text-white shadow-md'}`}>PROCESS</button>
              </div>
            </motion.div>
          </div>
        )}

        {meetingScript && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`maze-border p-12 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-10">
                <span className={`arcade-font text-[16px] uppercase ${isDark ? 'text-yellow-400' : 'text-[#2121ff]'}`}>Presenter Script</span>
                <button onClick={() => setMeetingScript(null)} className="text-2xl hover:text-red-500">✕</button>
              </div>
              <div className={`font-serif text-xl leading-relaxed prose max-w-none ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {meetingScript.split('\n').map((line, i) => (
                   <p key={i} className="mb-4">{line.includes('[') ? <span className="bg-yellow-500/20 text-yellow-500 font-bold px-2 py-1 rounded">{line}</span> : line}</p>
                ))}
              </div>
              <div className="mt-12 flex justify-center">
                <button onClick={() => setMeetingScript(null)} className={`arcade-font text-[12px] px-10 py-5 ${isDark ? 'bg-yellow-400 text-black' : 'bg-[#2121ff] text-white shadow-xl'}`}>EXIT PRESENTER MODE</button>
              </div>
            </motion.div>
          </div>
        )}

        {isProcessing && (
          <div className={`fixed inset-0 z-[110] flex flex-col items-center justify-center p-10 text-center ${isDark ? 'bg-black' : 'bg-[#f0f0ff]'}`}>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className={`arcade-font text-2xl mb-16 ${isDark ? 'text-yellow-400' : 'text-[#2121ff]'}`}>LEVELING UP...</motion.div>
            <p className={`arcade-font text-[10px] animate-pulse uppercase tracking-widest ${isDark ? 'text-emerald-500' : 'text-[#2121ff]'}`}>{processingStep}</p>
          </div>
        )}

        {editingStory && <EditStoryModal story={editingStory} users={allAvailableUsers} currentUser={currentUser} isDarkTheme={isDark} allStories={stories} onClose={() => setEditingStory(null)} onSave={async s => {
          const isNew = !stories.find(old => old.id === s.id);
          if (isNew) { setStories(prev => [...prev, s]); } else { setStories(prev => prev.map(old => old.id === s.id ? s : old)); }
          await supabaseService.upsertStory(s, projectName);
          setEditingStory(null);
        }} />}
      </AnimatePresence>
    </div>
  );
};

export default App;