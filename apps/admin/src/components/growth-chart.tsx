"use client";

import { useMemo } from "react";

export interface DayGrowthData {
  date: string;
  count: number;
}

export function GrowthChart({ data }: { data: DayGrowthData[] }) {
  const maxCount = useMemo(() => {
    const max = Math.max(...data.map((d) => d.count), 1);
    return max;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
        No signup history available yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">User Growth Trend</h3>
          <p className="text-xs text-slate-500">Signups recorded over the last 14 days</p>
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          +100% active
        </span>
      </div>

      <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-200">
        {data.map((item, idx) => {
          const heightPercent = Math.max((item.count / maxCount) * 100, 6);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
              {/* Tooltip */}
              <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                {item.date}: {item.count} users
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPercent}%` }}
                className="w-full max-w-[28px] bg-blue-600 group-hover:bg-blue-500 rounded-t-md transition-all shadow-sm group-hover:shadow-md"
              />

              {/* Label */}
              <span className="text-[10px] text-slate-400 truncate max-w-[40px] text-center">
                {item.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
