import React from 'react';
import { Task, TaskType, Priority } from '../types';
import { User, Trash2, ArrowUp, ArrowDown } from './Icons';

interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onClick?: () => void;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  featured?: boolean; // For the top backlog items
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDelete, onClick, compact = false, draggable, onDragStart, featured = false }) => {
  const getTypeColor = (type: TaskType) => {
    switch (type) {
      case TaskType.BUG: return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case TaskType.STORY: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case TaskType.TASK: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  const getPointsColor = (points: number) => {
    if (points >= 8) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (points >= 5) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return <ArrowUp size={12} className="text-rose-500" />;
      case Priority.LOW: return <ArrowDown size={12} className="text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div 
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={onClick}
      className={`
        group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${featured 
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-indigo-500/50 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] hover:shadow-indigo-500/40' 
          : 'bg-slate-800/60 backdrop-blur-sm border-slate-700/50 hover:border-slate-500 hover:shadow-md hover:bg-slate-800'}
        ${compact ? 'p-3' : 'p-4'}
        active:scale-[0.98]
        focus-within:ring-2 focus-within:ring-neonCyan focus-within:border-transparent
      `}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${task.title}, Priority: ${task.priority}`}
    >
      {/* "NFT" Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex justify-between items-start mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTypeColor(task.type)} uppercase tracking-wider`}>
            {task.type}
          </span>
          {task.priority === Priority.HIGH && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              HIGH
            </span>
          )}
        </div>
        
        {/* Delete Button - Accessible on focus-within and hover */}
        <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
           <button 
             onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
             className="text-slate-500 hover:text-rose-400 p-1.5 rounded-full hover:bg-rose-900/20 transition-colors focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
             aria-label="Delete task"
           >
             <Trash2 size={14} />
           </button>
        </div>
      </div>

      <h3 className={`font-semibold text-slate-100 mb-1 leading-snug ${compact ? 'text-sm' : 'text-base'} ${featured ? 'text-lg text-klimt' : ''}`}>
        {task.title}
      </h3>
      
      {!compact && (
        <p className="text-slate-400 text-xs line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700/50 relative z-10">
        <div className="flex items-center gap-2">
           <div className={`flex items-center justify-center min-w-[24px] h-6 rounded px-1.5 text-xs font-bold border ${getPointsColor(task.points)}`}>
            {task.points}
          </div>
          {getPriorityIcon(task.priority)}
        </div>
        
        <div className="flex -space-x-2">
           {/* Avatar Assignment UI (Mock) */}
           {task.assignee ? (
             <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold border-2 border-slate-800 shadow-sm">
                {task.assignee}
             </div>
           ) : (
             <button className="w-6 h-6 rounded-full bg-slate-700/50 hover:bg-slate-600 flex items-center justify-center border border-dashed border-slate-500 text-slate-400 transition-colors">
               <User size={10} />
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;