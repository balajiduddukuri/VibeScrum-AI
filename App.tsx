import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, ListTodo, Kanban, Plus, Sparkles, Search, ChevronRight, Clock,
  Play, Download, Volume2, VolumeX, Sun, Moon, Filter, BookOpen, Star, Pause, Settings, X, Menu
} from './components/Icons';
import TaskCard from './components/TaskCard';
import Modal from './components/Modal';
import PromptLibrary from './components/PromptLibrary';
import ErrorBoundary from './components/ErrorBoundary';
import { Task, TaskStatus, TaskType, ViewMode, Priority, SprintSettings } from './types';
import { generateBacklogItems, refineTaskDescription, estimateTaskPoints } from './services/geminiService';
import { playSound } from './utils/audio';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Initial Data
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Setup Project Repository', description: 'Initialize Git repo with TypeScript and Tailwind config.', status: TaskStatus.DONE, type: TaskType.TASK, priority: Priority.HIGH, points: 1, createdAt: new Date().toISOString() },
  { id: '2', title: 'Design Authentication Flow', description: 'Create Figma designs for login, signup, and forgot password screens.', status: TaskStatus.IN_PROGRESS, type: TaskType.STORY, priority: Priority.HIGH, points: 5, createdAt: new Date().toISOString() },
  { id: '3', title: 'Fix Navigation Bug on Mobile', description: 'Sidebar does not close when clicking outside on iOS devices.', status: TaskStatus.BACKLOG, type: TaskType.BUG, priority: Priority.MEDIUM, points: 3, createdAt: new Date().toISOString() },
];

const INITIAL_SPRINT: SprintSettings = {
  isStarted: false,
  durationWeeks: 2,
  goal: "Deliver MVP features"
};

const TRENDING_IDEAS = [
  "AI-Powered Personal Finance Advisor",
  "Sustainable Supply Chain Platform",
  "Virtual Reality Education System",
  "Decentralized Creator Economy App",
  "Smart Home Energy Manager"
];

function App() {
  // State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [sprintSettings, setSprintSettings] = useState<SprintSettings>(INITIAL_SPRINT);
  const [view, setView] = useState<ViewMode>('KANBAN');
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // UI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // New Task State
  const [projectPrompt, setProjectPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>(TaskType.STORY);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.MEDIUM);
  const [newTaskPoints, setNewTaskPoints] = useState(1);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TaskStatus.BACKLOG);

  // Drag State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    const savedTasks = localStorage.getItem('vibe_tasks');
    const savedSprint = localStorage.getItem('vibe_sprint');
    const savedTheme = localStorage.getItem('vibe_theme');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSprint) setSprintSettings(JSON.parse(savedSprint));
    if (savedTheme) setTheme(savedTheme as 'dark' | 'light');
  }, []);

  useEffect(() => {
    localStorage.setItem('vibe_tasks', JSON.stringify(tasks));
    localStorage.setItem('vibe_sprint', JSON.stringify(sprintSettings));
    localStorage.setItem('vibe_theme', theme);
    
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [tasks, sprintSettings, theme]);

  // Audio Helper
  const play = (type: 'success' | 'click' | 'hover' | 'error') => {
    if (isSoundOn) playSound(type);
  };

  // Actions
  const handleGenerateBacklog = async () => {
    if (!projectPrompt.trim()) return;
    setIsGenerating(true);
    const newItems = await generateBacklogItems(projectPrompt);
    const formedTasks: Task[] = newItems.map((item, index) => ({
      id: Date.now().toString() + index,
      title: item.title || 'Untitled',
      description: item.description || '',
      status: TaskStatus.BACKLOG,
      type: item.type || TaskType.STORY,
      points: item.points || 1,
      priority: item.priority || Priority.MEDIUM,
      createdAt: new Date().toISOString()
    }));
    setTasks(prev => [...prev, ...formedTasks]);
    setIsGenerating(false);
    setIsAIModalOpen(false);
    setProjectPrompt('');
    setView('BACKLOG');
    play('success');
  };

  const handleEstimateTask = async (task: Task) => {
    play('click');
    const points = await estimateTaskPoints(task.title, task.description);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, points } : t));
    play('success');
  };

  const handleRefineTask = async (task: Task) => {
     play('click');
     const { description, acceptanceCriteria } = await refineTaskDescription(task.title);
     setTasks(prev => prev.map(t => t.id === task.id ? { ...t, description, acceptanceCriteria } : t));
     play('success');
  };

  const openNewTaskModal = (status: TaskStatus = TaskStatus.BACKLOG) => {
    setNewTaskStatus(status);
    setIsTaskModalOpen(true);
    play('click');
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: 'Click refine to generate details.',
      status: newTaskStatus,
      type: newTaskType,
      priority: newTaskPriority,
      points: newTaskPoints,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, task]);
    setIsTaskModalOpen(false);
    setNewTaskTitle('');
    play('success');
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    play('click');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status } : t));
      setDraggedTaskId(null);
      play('hover'); // Subtle sound for drop
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Priority', 'Points', 'Status', 'Description'];
    const rows = tasks.map(t => [t.id, t.title, t.type, t.priority, t.points, t.status, `"${t.description.replace(/"/g, '""')}"`]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scrum_board.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    play('success');
  };

  // Derived State
  const filteredTasks = tasks.filter(t => {
     const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
     const matchesPriority = filterPriority === 'ALL' || t.priority === filterPriority;
     return matchesSearch && matchesPriority;
  });

  const backlogTasks = filteredTasks.filter(t => t.status === TaskStatus.BACKLOG);
  // Sort backlog: High priority first
  backlogTasks.sort((a, b) => {
     const pMap = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
     return pMap[b.priority] - pMap[a.priority];
  });
  
  const sprintTasks = filteredTasks.filter(t => t.status !== TaskStatus.BACKLOG);

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter(t => t.status === status);

  const sprintStats = [
    { name: 'To Do', value: getTasksByStatus(TaskStatus.SPRINT_TODO).length, color: '#94a3b8' },
    { name: 'In Progress', value: getTasksByStatus(TaskStatus.IN_PROGRESS).length, color: '#6366f1' },
    { name: 'Review', value: getTasksByStatus(TaskStatus.REVIEW).length, color: '#a855f7' },
    { name: 'Done', value: getTasksByStatus(TaskStatus.DONE).length, color: '#10b981' },
  ];

  const totalPoints = sprintTasks.reduce((acc, t) => acc + t.points, 0);
  const donePoints = getTasksByStatus(TaskStatus.DONE).reduce((acc, t) => acc + t.points, 0);
  const progress = totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0;

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-deepVoid text-slate-100 font-sans overflow-hidden">
        
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static top-0 left-0 h-full w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-40 transition-transform duration-300
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-4 lg:p-6 flex items-center justify-between lg:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neonCyan to-neonMagenta rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Layout size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-klimt">
                VibeScrum
              </h1>
            </div>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            <SidebarItem active={view === 'BACKLOG'} onClick={() => { setView('BACKLOG'); setIsMobileSidebarOpen(false); play('click'); }} icon={<ListTodo size={20} />} label="Backlog" badge={backlogTasks.length} />
            <SidebarItem active={view === 'SPRINT'} onClick={() => { setView('SPRINT'); setIsMobileSidebarOpen(false); play('click'); }} icon={<Clock size={20} />} label="Sprint" badge={sprintTasks.length} />
            <SidebarItem active={view === 'KANBAN'} onClick={() => { setView('KANBAN'); setIsMobileSidebarOpen(false); play('click'); }} icon={<Kanban size={20} />} label="Board" badge={getTasksByStatus(TaskStatus.IN_PROGRESS).length} />
            <SidebarItem active={view === 'PROMPTS'} onClick={() => { setView('PROMPTS'); setIsMobileSidebarOpen(false); play('click'); }} icon={<BookOpen size={20} />} label="Prompts" />
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-4">
             <div className="flex justify-center gap-4">
               <button onClick={() => { setIsSoundOn(!isSoundOn); play('click'); }} className="text-slate-500 hover:text-indigo-400 transition-colors">
                  {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
               </button>
               <button onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); play('click'); }} className="text-slate-500 hover:text-amber-400 transition-colors">
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
             </div>
            <button 
              onClick={() => { setIsAIModalOpen(true); setIsMobileSidebarOpen(false); play('click'); }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-900/50 hover:shadow-indigo-600/30 group"
            >
              <Sparkles size={18} className="group-hover:animate-pulse" />
              <span className="font-medium text-sm">AI Agent</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 lg:h-20 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-900/60 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white p-2 -ml-2"
               >
                 <Menu size={24} />
               </button>
               <div className="flex flex-col">
                  <h2 className="text-lg lg:text-2xl font-bold text-slate-100 flex items-center gap-2">
                    {view === 'BACKLOG' && 'Product Backlog'}
                    {view === 'SPRINT' && 'Sprint Planning'}
                    {view === 'KANBAN' && 'Kanban Board'}
                    {view === 'PROMPTS' && 'Prompt Library'}
                  </h2>
                  <span className="hidden lg:block text-xs text-slate-500 font-mono">
                    {view === 'SPRINT' || view === 'KANBAN' ? `Sprint: ${sprintSettings.goal}` : 'Project Overview'}
                  </span>
               </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-800/50 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setFilterPriority('ALL')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterPriority === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All
                </button>
                <button 
                   onClick={() => setFilterPriority(Priority.HIGH)}
                   className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filterPriority === Priority.HIGH ? 'bg-rose-900/30 text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}
                >
                  High
                </button>
              </div>

              <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-neonCyan transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..." 
                  className="bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-neonCyan/50 focus:border-neonCyan transition-all placeholder:text-slate-600"
                />
              </div>

              <button 
                onClick={exportCSV}
                className="text-slate-400 hover:text-neonCyan transition-colors p-2 hidden sm:block"
                title="Export CSV"
              >
                <Download size={20} />
              </button>

              <button 
                onClick={() => openNewTaskModal(TaskStatus.BACKLOG)}
                className="bg-slate-100 hover:bg-white text-slate-900 p-2 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>
          </header>

          {/* View Content */}
          <div className={`flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 bg-deepVoid relative ${view === 'BACKLOG' ? 'bg-vangogh' : ''}`}>
             
             {/* Dynamic Background Elements */}
             {view !== 'BACKLOG' && (
                <>
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>
                  <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
                </>
             )}

             {/* BACKLOG VIEW */}
             {view === 'BACKLOG' && (
               <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                  {/* Top Priority Showcase (NFT Cards) */}
                  {backlogTasks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {backlogTasks.slice(0, 3).map((task, idx) => (
                        <div key={task.id} className={`transform ${idx === 1 ? 'md:-translate-y-4' : ''}`}>
                           <div className="flex justify-between items-center mb-2 px-1">
                              <span className="text-xs font-bold text-klimt tracking-widest uppercase">
                                {idx === 0 ? 'Top Priority' : 'Featured'}
                              </span>
                              <Star size={12} className="text-klimt" fill="#ffd700" />
                           </div>
                           <TaskCard 
                             task={task} 
                             onDelete={handleDeleteTask} 
                             featured={true}
                             onClick={() => handleRefineTask(task)}
                           />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="glass-panel rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4 text-slate-400 text-sm font-medium uppercase tracking-wider">
                      <span>Backlog Inventory</span>
                      <span>{backlogTasks.length} Items</span>
                    </div>
                    <div className="space-y-3">
                      {backlogTasks.slice(3).map(task => (
                         <div key={task.id} className="flex gap-4 items-center group">
                           <div className="flex-1">
                             <TaskCard task={task} onDelete={handleDeleteTask} />
                           </div>
                           <button 
                             onClick={() => {
                               setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.SPRINT_TODO } : t));
                               play('success');
                             }}
                             className="opacity-0 group-hover:opacity-100 focus:opacity-100 bg-slate-800 text-neonCyan p-3 rounded-lg border border-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all shadow-lg transform lg:translate-x-[-10px] lg:group-hover:translate-x-0"
                             title="Move to Sprint"
                             aria-label="Move to Sprint"
                           >
                             <ChevronRight size={20} />
                           </button>
                         </div>
                      ))}
                      {backlogTasks.length === 0 && <EmptyState onClick={() => setIsAIModalOpen(true)} />}
                    </div>
                  </div>
               </div>
             )}

             {/* SPRINT VIEW */}
             {view === 'SPRINT' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full animate-in fade-in duration-500">
                  
                  {/* Left: Planning Source */}
                  <div className="glass-panel rounded-xl flex flex-col overflow-hidden lg:h-full max-h-[500px] lg:max-h-none">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                       <h3 className="font-medium text-slate-300 flex items-center gap-2">
                         <ListTodo size={16} /> Backlog
                       </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                       {backlogTasks.map(task => (
                          <div key={task.id} className="relative group">
                            <TaskCard task={task} onDelete={handleDeleteTask} compact />
                            <button 
                              onClick={() => {
                                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.SPRINT_TODO } : t));
                                play('click');
                              }}
                              className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              title="Add to Sprint"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                       ))}
                       {backlogTasks.length === 0 && (
                          <p className="text-slate-500 text-sm text-center py-4">Backlog empty.</p>
                       )}
                    </div>
                  </div>

                  {/* Middle: Active Sprint */}
                  <div className="glass-panel rounded-xl flex flex-col overflow-hidden lg:h-full max-h-[600px] lg:max-h-none relative border-neonCyan/20">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonCyan to-neonMagenta"></div>
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                       <h3 className="font-medium text-neonCyan flex items-center gap-2">
                         <Clock size={16} /> Current Sprint
                       </h3>
                       <button 
                         onClick={() => {
                            setSprintSettings(s => ({ ...s, isStarted: !s.isStarted }));
                            play('success');
                         }}
                         className={`text-xs px-2 py-1 rounded font-bold ${sprintSettings.isStarted ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                       >
                         {sprintSettings.isStarted ? 'Stop Sprint' : 'Start Sprint'}
                       </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                       {getTasksByStatus(TaskStatus.SPRINT_TODO).map(task => (
                          <div key={task.id} className="relative group">
                            <TaskCard task={task} onDelete={handleDeleteTask} />
                            <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => handleEstimateTask(task)}
                                 className="bg-slate-700 text-slate-300 p-1.5 rounded hover:text-white"
                                 title="AI Estimate"
                               >
                                 <Sparkles size={12} />
                               </button>
                               <button 
                                 onClick={() => {
                                   setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.BACKLOG } : t));
                                   play('click');
                                 }}
                                 className="bg-slate-700 text-rose-400 p-1.5 rounded hover:bg-rose-900/50"
                               >
                                 <X size={12} />
                               </button>
                            </div>
                          </div>
                       ))}
                       {getTasksByStatus(TaskStatus.SPRINT_TODO).length === 0 && (
                          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-800 rounded-lg text-slate-600 text-sm m-4">
                            <p>Drag tasks here</p>
                          </div>
                       )}
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex flex-col gap-6">
                    <div className="glass-panel p-6 rounded-xl">
                      <h3 className="text-slate-300 font-medium mb-4">Sprint Progress</h3>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                           <span className="text-slate-400">Completion</span>
                           <span className="text-neonCyan font-mono">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-neonCyan to-blue-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                           <div className="text-2xl font-bold text-white">{totalPoints}</div>
                           <div className="text-xs text-slate-500 uppercase">Total Points</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                           <div className="text-2xl font-bold text-emerald-400">{donePoints}</div>
                           <div className="text-xs text-slate-500 uppercase">Completed</div>
                        </div>
                      </div>
                    </div>

                     <div className="glass-panel p-6 rounded-xl flex-1 min-h-[300px]">
                      <h3 className="text-slate-300 font-medium mb-4">Burndown / Dist</h3>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sprintStats}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              cursor={{fill: '#334155', opacity: 0.2}} 
                              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {sprintStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
               </div>
             )}

             {/* KANBAN VIEW */}
             {view === 'KANBAN' && (
               <div className="flex h-full gap-6 overflow-x-auto pb-4 items-start animate-in fade-in duration-500 snap-x">
                  <KanbanColumn 
                    title="To Do" 
                    tasks={getTasksByStatus(TaskStatus.SPRINT_TODO)} 
                    status={TaskStatus.SPRINT_TODO}
                    color="border-slate-500"
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDelete={handleDeleteTask}
                    moveTask={(id, s) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)); play('click'); }}
                    onAdd={openNewTaskModal}
                  />
                  <KanbanColumn 
                    title="In Progress" 
                    tasks={getTasksByStatus(TaskStatus.IN_PROGRESS)} 
                    status={TaskStatus.IN_PROGRESS}
                    color="border-neonCyan"
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDelete={handleDeleteTask}
                    moveTask={(id, s) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)); play('click'); }}
                    onAdd={openNewTaskModal}
                  />
                  <KanbanColumn 
                    title="Review" 
                    tasks={getTasksByStatus(TaskStatus.REVIEW)} 
                    status={TaskStatus.REVIEW}
                    color="border-purple-500"
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDelete={handleDeleteTask}
                    moveTask={(id, s) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)); play('click'); }}
                    onAdd={openNewTaskModal}
                  />
                  <KanbanColumn 
                    title="Done" 
                    tasks={getTasksByStatus(TaskStatus.DONE)} 
                    status={TaskStatus.DONE}
                    color="border-emerald-500"
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    onDelete={handleDeleteTask}
                    moveTask={(id, s) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, status: s } : t)); play('click'); }}
                    onAdd={openNewTaskModal}
                  />
               </div>
             )}

             {/* PROMPT LIBRARY */}
             {view === 'PROMPTS' && (
               <div className="max-w-4xl mx-auto">
                 <PromptLibrary />
               </div>
             )}
          </div>
        </main>

        {/* MODALS */}
        <Modal 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          title="AI Project Kickoff"
        >
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              I am your <span className="text-neonCyan font-bold">AI Product Owner</span>. Tell me about your project, and I will draft a backlog for you.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
               <span className="text-xs text-slate-500 font-medium py-1">Trending:</span>
               {TRENDING_IDEAS.map((idea) => (
                 <button
                   key={idea}
                   onClick={() => setProjectPrompt(idea)}
                   className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-400 rounded-full px-3 py-1 transition-all"
                 >
                   {idea}
                 </button>
               ))}
            </div>

            <textarea 
              value={projectPrompt}
              onChange={(e) => setProjectPrompt(e.target.value)}
              placeholder="e.g. A cyberpunk-themed e-commerce store for digital artifacts..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-neonCyan focus:border-transparent outline-none resize-none placeholder:text-slate-600 font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAIModalOpen(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateBacklog}
                disabled={isGenerating || !projectPrompt}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Create Backlog
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>

        <Modal 
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
          title="Create New Task"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 focus:border-neonCyan outline-none"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                <select 
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-sm"
                >
                  <option value={TaskType.STORY}>Story</option>
                  <option value={TaskType.TASK}>Task</option>
                  <option value={TaskType.BUG}>Bug</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                <select 
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-sm"
                >
                  <option value={Priority.HIGH}>High</option>
                  <option value={Priority.MEDIUM}>Medium</option>
                  <option value={Priority.LOW}>Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Points</label>
                <select 
                  value={newTaskPoints}
                  onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none text-sm"
                >
                  {[1, 2, 3, 5, 8, 13, 21].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={handleAddTask}
                className="bg-neonCyan hover:bg-cyan-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </ErrorBoundary>
  );
}

// Subcomponents

const SidebarItem = ({ active, onClick, icon, label, badge }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-slate-800 text-neonCyan' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge > 0 && (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
        {badge}
      </span>
    )}
  </button>
);

const EmptyState = ({ onClick }: { onClick: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
      <Sparkles className="text-neonCyan" size={32} />
    </div>
    <h3 className="text-lg font-medium text-white mb-2">It's quiet... too quiet.</h3>
    <p className="text-slate-400 text-center max-w-sm mb-6">
      Generate a project plan instantly with our AI Product Owner.
    </p>
    <button 
      onClick={onClick}
      className="text-neonCyan font-medium hover:text-cyan-300 transition-colors flex items-center gap-2"
    >
      Wake the AI <ChevronRight size={16} />
    </button>
  </div>
);

const KanbanColumn = ({ title, tasks, status, color, onDrop, onDragStart, onDelete, moveTask, onAdd }: any) => (
  <div 
    onDrop={(e) => onDrop(e, status)}
    onDragOver={(e) => e.preventDefault()}
    className="min-w-[300px] w-[85vw] sm:w-[300px] flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800/50 backdrop-blur-sm snap-center"
  >
    <div className={`p-4 border-b border-slate-800/60 border-t-4 ${color} rounded-t-xl bg-slate-900/60`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <h3 className="font-medium text-slate-200">{title}</h3>
           <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded">{tasks.length}</span>
        </div>
        <button 
          onClick={() => onAdd(status)}
          className="text-slate-500 hover:text-white transition-colors p-1 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-neonCyan"
          title="Add Task to this column"
          aria-label={`Add task to ${title}`}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
    <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
      {tasks.length === 0 && (
         <button 
           onClick={() => onAdd(status)}
           className="w-full h-20 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-700 transition-all text-sm gap-2"
         >
           <Plus size={16} /> Add Task
         </button>
      )}
      {tasks.map((task: Task) => (
        <div key={task.id} className="group">
           <TaskCard 
            task={task} 
            onDelete={onDelete} 
            draggable 
            onDragStart={onDragStart}
          />
           {/* Mobile / Keyboard Actions */}
           <div className="flex justify-between mt-1 px-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              {status !== TaskStatus.SPRINT_TODO && (
                 <button onClick={() => moveTask(task.id, TaskStatus.SPRINT_TODO)} className="text-[10px] text-slate-500 hover:text-white focus:text-white p-1">To Do</button>
              )}
              {status !== TaskStatus.IN_PROGRESS && (
                 <button onClick={() => moveTask(task.id, TaskStatus.IN_PROGRESS)} className="text-[10px] text-slate-500 hover:text-white focus:text-white p-1">In Prog</button>
              )}
               {status !== TaskStatus.REVIEW && (
                 <button onClick={() => moveTask(task.id, TaskStatus.REVIEW)} className="text-[10px] text-slate-500 hover:text-white focus:text-white p-1">Review</button>
              )}
              {status !== TaskStatus.DONE && (
                 <button onClick={() => moveTask(task.id, TaskStatus.DONE)} className="text-[10px] text-slate-500 hover:text-white focus:text-white p-1">Done</button>
              )}
           </div>
        </div>
      ))}
    </div>
  </div>
);

export default App;