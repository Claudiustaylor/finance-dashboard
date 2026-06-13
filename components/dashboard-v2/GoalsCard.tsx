"use client";

import { Check, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Goal {
  name: string;
  saved: number;
  target: number;
  color: string;
}

interface GoalsCardProps {
  featured?: { name: string; saved: number; target: number };
  goals?: Goal[];
}

const DEFAULT_GOALS: Goal[] = [
  { name: "Tesla X Model", saved: 12000, target: 100000, color: "bg-[#0071c5]" },
  { name: "iPhone 17 Pro", saved: 1120, target: 2000, color: "bg-emerald-500" },
  { name: "iPhone 18 Pro Max", saved: 1680, target: 3000, color: "bg-violet-500" },
];

export function GoalsCard({
  featured = { name: "Swiss Holiday", saved: 1224, target: 2000 },
  goals = DEFAULT_GOALS,
}: GoalsCardProps) {
  const pct = Math.round((featured.saved / featured.target) * 100);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">My goals</p>
        <button className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Featured dark goal card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{featured.name}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold">
                ${featured.saved.toLocaleString()}
              </span>
              <span className="text-sm text-white/50">
                / ${featured.target.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Circular progress indicator */}
          <div className="relative flex size-14 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#00aeef"
                strokeWidth="3"
                strokeDasharray={`${pct}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex size-7 items-center justify-center rounded-full bg-emerald-500">
              <Check className="size-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Goal list */}
      <div className="mt-4 space-y-4">
        {goals.map((g) => {
          const p = Math.min(100, Math.round((g.saved / g.target) * 100));
          return (
            <div key={g.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{g.name}</span>
                <span className="text-xs font-semibold text-slate-500">{p}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-full rounded-full", g.color)}
                  style={{ width: `${p}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-5 w-full rounded-full border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      >
        <Plus className="size-3.5" />
        Add new goal
      </Button>
    </div>
  );
}
