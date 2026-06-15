"use client";

import { useState } from "react";
import { Check, MoreHorizontal, Plus, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";

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

const COLOR_OPTIONS = [
  { label: "Blue", value: "bg-[#0071c5]" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Violet", value: "bg-violet-500" },
  { label: "Rose", value: "bg-rose-500" },
  { label: "Amber", value: "bg-amber-500" },
];

export function GoalsCard({
  featured: initialFeatured = { name: "Swiss Holiday", saved: 1224, target: 2000 },
  goals: initialGoals = DEFAULT_GOALS,
}: GoalsCardProps) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [goals, setGoals] = useState(initialGoals);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);

  const pct = Math.round((featured.saved / featured.target) * 100);

  function openAdd() {
    setAddOpen(true);
    setName("");
    setTarget("");
    setSaved("");
    setColor(COLOR_OPTIONS[0].value);
    setMenuOpen(false);
  }

  function openEdit() {
    setEditOpen(true);
    setName(featured.name);
    setTarget(String(featured.target));
    setSaved(String(featured.saved));
    setMenuOpen(false);
  }

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    const s = Number(saved);
    if (!name.trim() || !t || t <= 0) return;
    setGoals((prev) => [...prev, { name: name.trim(), saved: Math.max(0, s), target: t, color }]);
    setAddOpen(false);
  }

  function saveFeatured(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(target);
    const s = Number(saved);
    if (!name.trim() || !t || t <= 0) return;
    setFeatured({ name: name.trim(), saved: Math.max(0, s), target: t });
    setEditOpen(false);
  }

  function resetDefaults() {
    setGoals(DEFAULT_GOALS);
    setFeatured({ name: "Swiss Holiday", saved: 1224, target: 2000 });
    setMenuOpen(false);
  }

  function removeGoal(nameToRemove: string) {
    setGoals((prev) => prev.filter((g) => g.name !== nameToRemove));
  }

  return (
    <>
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-slate-900">My goals</p>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-slate-100 bg-white p-1 shadow-lg">
                <button
                  onClick={openEdit}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Edit goals
                </button>
                <button
                  onClick={resetDefaults}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="size-3.5" />
                  Reset defaults
                </button>
              </div>
            )}
          </div>
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">{p}%</span>
                    <button
                      onClick={() => removeGoal(g.name)}
                      className="text-slate-300 hover:text-rose-500"
                      aria-label={`Remove ${g.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
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
          onClick={openAdd}
          variant="outline"
          size="sm"
          className="mt-5 w-full rounded-full border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          <Plus className="size-3.5" />
          Add new goal
        </Button>
      </div>

      {/* Add new goal sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Add new goal</SheetTitle>
            <SheetDescription>Create a savings goal to track your progress.</SheetDescription>
          </SheetHeader>
          <form onSubmit={addGoal} className="flex flex-1 flex-col gap-4 px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input id="goal-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New laptop" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input id="goal-target" type="number" min="1" step="0.01" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-saved">Already saved (optional)</Label>
              <Input id="goal-saved" type="number" min="0" step="0.01" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                      color === c.value ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <span className={cn("size-3 rounded-full", c.value)} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <SheetFooter className="mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="w-full bg-[#0071c5] text-white hover:bg-[#005fa6] sm:w-auto">Add goal</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Edit featured goal sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit goals</SheetTitle>
            <SheetDescription>Update your featured goal.</SheetDescription>
          </SheetHeader>
          <form onSubmit={saveFeatured} className="flex flex-1 flex-col gap-4 px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="feat-name">Featured goal name</Label>
              <Input id="feat-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feat-target">Target amount</Label>
              <Input id="feat-target" type="number" min="1" step="0.01" required value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feat-saved">Saved so far</Label>
              <Input id="feat-saved" type="number" min="0" step="0.01" required value={saved} onChange={(e) => setSaved(e.target.value)} />
            </div>
            <SheetFooter className="mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="w-full bg-[#0071c5] text-white hover:bg-[#005fa6] sm:w-auto">Save goal</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
