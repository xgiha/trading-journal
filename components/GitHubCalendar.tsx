import React, { useState, useEffect } from "react";
import { format, subDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

interface ContributionDay {
  date: string; // ISO date string (e.g., "2025-09-13")
  count: number;
}

interface GitHubCalendarProps {
  data: ContributionDay[]; // Contribution data
  colors?: string[]; // Custom color scale (default: GitHub-like greens)
}

const GitHubCalendar = ({ data, colors = ["#27272a", "#064e3b", "#065f46", "#10b981", "#34d399"] }: GitHubCalendarProps) => {
  // Use a separate type for internal state where date is a Date object
  const [contributions, setContributions] = useState<{ date: Date; count: number }[]>([]);
  
  // Adjust logic to show mostly the recent months to fit the "small card" requirement better, 
  // but keeping the logic robust enough for a year if needed.
  // We will reduce weeks to 20 to fit nicely in a smaller card without scrolling.
  const weeks = 24; 
  const today = new Date();
  const startDate = subDays(today, (weeks * 7) - 1); 

  // Process data prop
  useEffect(() => {
    setContributions(data.map((item) => ({ ...item, date: new Date(item.date) })));
  }, [data]);

  // Get color based on contribution count
  const getColor = (count: number) => {
    if (count === 0) return colors[0];
    if (count === 1) return colors[1];
    if (count === 2) return colors[2];
    if (count === 3) return colors[3];
    return colors[4] || colors[colors.length - 1]; // Fallback to last color
  };

  // Render weeks
  const renderWeeks = () => {
    const weeksArray = [];
    let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    for (let i = 0; i < weeks; i++) {
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }),
      });

      weeksArray.push(
        <div key={i} className="flex flex-col gap-1">
          {weekDays.map((day, index) => {
            const contribution = contributions.find((c) => isSameDay(c.date, day));
            const color = contribution ? getColor(contribution.count) : colors[0];

            return (
              <div
                key={index}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-[2px] transition-colors duration-300`}
                style={{ backgroundColor: color }}
                title={`${format(day, "MMM d")}: ${contribution?.count || 0} trades`}
              />
            );
          })}
        </div>
      );
      currentWeekStart = addDays(currentWeekStart, 7);
    }

    return weeksArray;
  };

  // Render month labels
  const renderMonthLabels = () => {
    const months = [];
    let currentMonth = startDate;
    // Simplified month label logic to avoid overlap
    let lastMonthLabel = "";
    
    for (let i = 0; i < weeks; i++) {
       const monthName = format(currentMonth, "MMM");
       if (monthName !== lastMonthLabel && i % 4 === 0) {
           months.push(
             <span key={i} className="text-[9px] text-nexus-muted uppercase font-bold" style={{ width: '40px' }}>
               {monthName}
             </span>
           );
           lastMonthLabel = monthName;
       } else {
           // Spacer
           months.push(<div key={i} className="w-2 sm:w-2.5"></div>)
       }
       currentMonth = addDays(currentMonth, 7);
    }
    return <div className="flex gap-1 mb-2 overflow-hidden">{months}</div>;
  };

  // Render day labels
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex">
        <div className="flex flex-col justify-between mt-[18px] mr-2 gap-1">
          {dayLabels.map((day, index) => (
            <span key={index} className="text-[8px] text-nexus-muted h-2 sm:h-2.5 flex items-center font-bold">
              {day}
            </span>
          ))}
        </div>
        <div className="overflow-hidden">
          {/* {renderMonthLabels()} - Hidden for cleaner look in small card, or enable if needed */}
          <div className="flex gap-1">{renderWeeks()}</div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCalendar;