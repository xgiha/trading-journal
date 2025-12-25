import React from "react"
import { Bell, ChevronUp, Zap, Edit3, Trash2, ShieldCheck } from "lucide-react"
import { ActivityLog } from "../types"
import { motion, AnimatePresence } from "framer-motion"

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface ActivityDropdownProps {
  logs: ActivityLog[];
  isOpen: boolean;
  onToggle: () => void;
}

export function ActivityDropdownComponent({ logs, isOpen, onToggle }: ActivityDropdownProps) {
  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'add': return <Zap className="h-3.5 w-3.5" />;
      case 'edit': return <Edit3 className="h-3.5 w-3.5" />;
      case 'delete': return <Trash2 className="h-3.5 w-3.5" />;
      default: return <ShieldCheck className="h-3.5 w-3.5" />;
    }
  };

  const getIconStyles = (type: ActivityLog['type']) => {
    switch (type) {
      case 'add': return "bg-emerald-500/20 text-emerald-400 border-emerald-500/20";
      case 'edit': return "bg-blue-500/20 text-blue-400 border-blue-500/20";
      case 'delete': return "bg-red-500/20 text-red-400 border-red-500/20";
      default: return "bg-purple-500/20 text-purple-400 border-purple-500/20";
    }
  };

  const displayLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);

  return (
    <div
      className={cn(
        "w-full max-w-[220px] overflow-hidden cursor-pointer select-none relative bg-white/[0.03] border border-white/10 transition-all duration-300",
        isOpen ? "rounded-3xl" : "rounded-[2rem]",
      )}
      onClick={() => !isOpen && onToggle()}
    >
      <div className="flex items-center gap-3 p-2 h-[56px] relative z-30">
        <div className="relative">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <Bell className="h-4 w-4 text-nexus-muted" />
            </div>
            {logs.length > 0 && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-nexus-accent rounded-full border-2 border-[#0c0c0e] animate-pulse"></div>
            )}
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Activities</h3>
          {!isOpen && (
            <p className="text-[9px] text-nexus-muted uppercase font-bold tracking-widest opacity-60 truncate mt-0.5">
              {logs.length} Recent Events
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 border border-white/10"
        >
          <ChevronUp className={cn("h-3 w-3 text-white transition-transform duration-300", isOpen ? "rotate-0" : "rotate-180")} />
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-30 overflow-hidden"
      >
        <div className="px-2 pb-4 pt-4 border-t border-white/10 mx-4">
          <div className="space-y-1">
            {displayLogs.length > 0 ? (
              displayLogs.map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-2xl p-2.5 hover:bg-white/5 border border-transparent hover:border-white/5">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border", getIconStyles(activity.type))}>
                    {getIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-tight">{activity.title}</h4>
                      <span className="text-[8px] text-nexus-muted font-mono opacity-50">{activity.time}</span>
                    </div>
                    <p className="text-[10px] text-nexus-muted truncate opacity-80 leading-tight">{activity.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-2 opacity-30">
                  <ShieldCheck size={24} className="text-nexus-muted" />
                  <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Stream is empty</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export const ActivityDropdown = React.memo(ActivityDropdownComponent);