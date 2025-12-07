import React, { useState } from 'react';
import { User, Sparkles, Zap, BookOpen, Copy, Check, PenTool, Plus, Trash2 } from './Icons';

interface Prompt {
  id: string;
  role: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  color: string;
  isCustom?: boolean;
}

const INITIAL_PROMPTS: Prompt[] = [
  {
    id: '1',
    role: 'Product Owner',
    title: 'Generate User Stories',
    text: 'Act as an experienced Product Owner. Generate 5 detailed user stories for [FEATURE NAME] following the INVEST criteria. Include acceptance criteria for each.',
    icon: <User size={18} />,
    color: 'text-blue-400 border-blue-400/20 bg-blue-400/10'
  },
  {
    id: '2',
    role: 'Scrum Master',
    title: 'Retrospective Ideas',
    text: 'Act as a Scrum Master. Suggest 3 creative formats for a Sprint Retrospective for a remote team that has been struggling with [ISSUE]. Focus on psychological safety.',
    icon: <Sparkles size={18} />,
    color: 'text-purple-400 border-purple-400/20 bg-purple-400/10'
  },
  {
    id: '3',
    role: 'Developer',
    title: 'Code Refactoring Plan',
    text: 'Act as a Senior Developer. I need to refactor a legacy React component that handles [FUNCTION]. Outline a step-by-step plan to refactor it to use Hooks and Context without breaking existing functionality.',
    icon: <Zap size={18} />,
    color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10'
  },
  {
    id: '4',
    role: 'Stakeholder',
    title: 'Explain Technical Debt',
    text: 'Act as a CTO explaining "Technical Debt" to non-technical stakeholders. Use a metaphor involving [METAPHOR, e.g., a kitchen, a loan] to explain why we need to dedicate this Sprint to refactoring.',
    icon: <BookOpen size={18} />,
    color: 'text-amber-400 border-amber-400/20 bg-amber-400/10'
  }
];

const PromptLibrary: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(INITIAL_PROMPTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextChange = (id: string, newText: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, text: newText } : p));
  };

  const handleAddCustomPrompt = () => {
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      role: 'Custom',
      title: 'New Custom Prompt',
      text: 'Enter your custom prompt here...',
      icon: <PenTool size={18} />,
      color: 'text-neonCyan border-cyan-400/20 bg-cyan-400/10',
      isCustom: true
    };
    setPrompts(prev => [newPrompt, ...prev]);
  };

  const handleDeletePrompt = (id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-200">Agile Prompt Library</h2>
        <button 
          onClick={handleAddCustomPrompt}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          Create Custom Prompt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
        {prompts.map((prompt) => (
          <div 
            key={prompt.id}
            className="bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group relative"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${prompt.color}`}>
                  {prompt.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200">{prompt.title}</h3>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{prompt.role}</span>
                </div>
              </div>
              {prompt.isCustom && (
                <button 
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                  title="Delete Custom Prompt"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            
            <div className="relative mb-4">
              <textarea
                value={prompt.text}
                onChange={(e) => handleTextChange(prompt.id, e.target.value)}
                className="w-full h-32 bg-slate-950/50 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed focus:ring-1 focus:ring-neonCyan focus:border-neonCyan outline-none resize-none transition-all placeholder:text-slate-600"
                spellCheck={false}
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-slate-600 pointer-events-none">
                {prompt.text.length} chars
              </div>
            </div>

            <button 
              onClick={() => handleCopy(prompt.text, prompt.id)}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                ${copiedId === prompt.id 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white'
                }
              `}
            >
              {copiedId === prompt.id ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Prompt
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptLibrary;