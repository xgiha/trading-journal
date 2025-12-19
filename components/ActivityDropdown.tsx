
import React, { useState } from "react"
import { Bell, MessageCircle, Award, Calendar, Tag, CheckSquare, ChevronUp, Zap, Target, ShieldAlert } from "lucide-react"

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

interface Activity {
  id: number
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  time: string
}

const activities: Activity[] = [
  {
    id: 1,
    icon: <Zap className="h-4 w-4" />,
    iconBg: "bg-nexus-accent/20 text-nexus-accent",
    title: "Trade Executed",
    description: "Gold Long position filled.",
    time: "Just Now",
  },
  {
    id: 2,
    icon: <Target className="h-4 w-4" />,
    iconBg: "bg-emerald-500/20 text-emerald-500",
    title: "Profit Target",
    description: "Daily goal has been reached.",
    time: "2 min ago",
  },
  {
    id: 3,
    icon: <ShieldAlert className="h-4 w-4" />,
    iconBg: "bg-red-500/20 text-red-500",
    title: "Risk Limit",
    description: "Stop loss adjusted for TSLA.",
    time: "3 hour ago",
  },
  {
    id: 4,
    icon: <Award className="h-4 w-4" />,
    iconBg: "bg-purple-500/20 text-purple-400",
    title: "Achievement",
    description: "10-day discipline streak.",
    time: "12 hours ago",
  },
  {
    id: 5,
    icon: <CheckSquare className="h-4 w-4" />,
    iconBg: "bg-blue-500/20 text-blue-400",
    title: "Review Due",
    description: "New task: Weekly trade audit.",
    time: "Yesterday",
  },
]

export function ActivityDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={cn(
        "w-full max-w-[220px] shadow-2xl overflow-hidden cursor-pointer select-none",
        "bg-[#0c0c0e]/80 backdrop-blur-3xl border border-white/5 shadow-black/50 isolate",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isOpen ? "rounded-3xl h-[400px]" : "rounded-[2rem] h-[56px]",
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-2 h-[56px]">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10 transition-colors duration-300">
          <Bell className="h-4 w-4 text-nexus-muted" />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Activities</h3>
          <p
            className={cn(
              "text-[9px] text-nexus-muted uppercase font-bold tracking-widest opacity-60",
              "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "opacity-0 max-h-0 mt-0" : "opacity-100 max-h-6 mt-0.5",
            )}
          >
            5 New Events
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center">
          <ChevronUp
            className={cn(
              "h-4 w-4 text-nexus-muted transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              isOpen ? "rotate-0" : "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Activity List */}
      <div
        className={cn(
          "grid",
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-4">
            <div className="space-y-1">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl p-2.5",
                    "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    "hover:bg-white/5 border border-transparent hover:border-white/5",
                    isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  )}
                  style={{
                    transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
                  }}
                >
                  <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                      activity.iconBg
                  )}>
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-tight">{activity.title}</h4>
                    <p className="text-[10px] text-nexus-muted truncate opacity-80">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
                <span className="text-[8px] text-nexus-muted uppercase font-bold tracking-widest opacity-40">End of stream</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
