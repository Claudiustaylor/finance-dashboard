"use client";

import { useState } from "react";
import { useCompliance, type Entity, type Filing } from "@/hooks/useCompliance";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Plus, Trash2, AlertTriangle, CheckCircle, Clock, ExternalLink,
  ChevronDown, ChevronUp, Building2, Download, CalendarCheck, Info, X,
  RefreshCw, WifiOff, Bell, BellOff
} from "lucide-react";
import { ALL_STATES, getStateRule, type StateRule } from "./StateRules";

/* ─── Helpers ─── */
function daysUntil(dateStr: string): number {
  if (dateStr === "Ongoing") return Infinity;
  const d = new Date(dateStr);
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getNextAnnualDueDate(formationDate: Date, freq: string): Date {
  const today = new Date();
  let due = new Date(formationDate);
  if (freq === "biennial") {
    while (due < today) due.setFullYear(due.getFullYear() + 2);
  } else {
    while (due < today) due.setFullYear(due.getFullYear() + 1);
  }
  return due;
}

function getFilingsForEntity(entity: Entity, rules: StateRule): Filing[] {
  const filings: Filing[] = [];
  const formDate = new Date(entity.formationDate);
  const idPrefix = entity.id;

  if (rules.annualReport.required) {
    const due = getNextAnnualDueDate(formDate, rules.annualReport.frequency);
    filings.push({
      id: `${idPrefix}-annual`, entityId: entity.id, type: "Annual Report",
      dueDate: due.toISOString().split("T")[0], cost: `$${rules.annualReport.cost}`,
      lateFee: `$${rules.annualReport.lateFee}`, completed: false,
      link: rules.annualReport.link, notes: rules.annualReport.notes,
    });
  }
  if (rules.franchiseTax?.required) {
    filings.push({
      id: `${idPrefix}-franchise`, entityId: entity.id, type: "Franchise Tax",
      dueDate: `${new Date().getFullYear()}-03-15`, cost: rules.franchiseTax.cost,
      lateFee: "Varies", completed: false,
      link: rules.franchiseTax.link, notes: rules.franchiseTax.notes,
    });
  }
  filings.push({
    id: `${idPrefix}-agent`, entityId: entity.id, type: "Registered Agent Verification",
    dueDate: "Ongoing", cost: "$0", lateFee: "Possible dissolution", completed: false,
    link: "", notes: rules.registeredAgent.notes,
  });
  return filings;
}

function generateICS(entityName: string, filings: Filing[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Titan Finance//Compliance//EN\r\n`;
  for (const f of filings) {
    if (f.dueDate === "Ongoing" || f.completed) continue;
    const dt = f.dueDate.replace(/-/g, "");
    const uid = `${f.id}@titan-finance.com`;
    ics += `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTAMP:${now}\r\nDTSTART;VALUE=DATE:${dt}\r\nDTEND;VALUE=DATE:${dt}\r\nSUMMARY:${entityName} — ${f.type}\r\nDESCRIPTION:Cost: ${f.cost} | Late Fee: ${f.lateFee} | Notes: ${f.notes}\r\nEND:VEVENT\r\n`;
  }
  ics += `END:VCALENDAR`;
  return ics;
}

function downloadICS(filename: string, ics: string) {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const ENTITY_TYPES = ["LLC", "Corp", "Nonprofit", "Partnership", "Sole Proprietorship"];

/* ─── Component ─── */
export function ComplianceManager() {
  const { entities, setEntities, completions, setCompletions, syncing, lastSynced, error, online, sync } = useCompliance();
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<StateRule | null>(null);
  const [newEntity, setNewEntity] = useState<Partial<Entity>>({
    type: "LLC", state: "DE",
    formationDate: new Date().toISOString().split("T")[0],
  });

  // Compute filings
  const allFilings: Filing[] = [];
  entities.forEach((e: Entity) => {
    const rules = getStateRule(e.state);
    const f = getFilingsForEntity(e, rules);
    f.forEach((item) => { item.completed = !!completions[item.id]; });
    allFilings.push(...f);
  });

  // Pass upcoming filings to notification hook
  const upcoming = allFilings
    .filter((f) => !f.completed && f.dueDate !== "Ongoing" && daysUntil(f.dueDate) < 90)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));

  const { perm, enabled, requestPermission } = useNotifications(upcoming);

  const addEntity = () => {
    if (!newEntity.name || !newEntity.state || !newEntity.formationDate) return;
    const entity: Entity = {
      id: crypto.randomUUID(), name: newEntity.name,
      type: (newEntity.type as any) || "LLC", state: newEntity.state,
      formationDate: newEntity.formationDate,
      ein: newEntity.ein, notes: newEntity.notes,
    };
    setEntities((prev: Entity[]) => [...prev, entity]);
    setShowAdd(false);
    setNewEntity({ type: "LLC", state: "DE", formationDate: new Date().toISOString().split("T")[0] });
  };

  const removeEntity = (id: string) => {
    setEntities((prev: Entity[]) => prev.filter((e) => e.id !== id));
  };

  const toggleFiling = (filingId: string) => {
    setCompletions((prev: Record<string, boolean>) => ({ ...prev, [filingId]: !prev[filingId] }));
  };

  const exportEntityICS = (entity: Entity) => {
    const rules = getStateRule(entity.state);
    const f = getFilingsForEntity(entity, rules);
    f.forEach((item) => { item.completed = !!completions[item.id]; });
    const ics = generateICS(entity.name, f);
    downloadICS(`${entity.name.replace(/\s+/g, "_")}_calendar.ics`, ics);
  };

  const exportAllICS = () => {
    const ics = generateICS("All Entities", allFilings);
    downloadICS("titan_compliance_calendar.ics", ics);
  };

  const syncLabel = lastSynced ? `Synced ${new Date(lastSynced).toLocaleTimeString()}` : "Not yet synced";

  return (
    <div className="space-y-6">
      {/* Sync bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-3">
          {!online && <WifiOff className="w-4 h-4 text-amber-400" />}
          <span className="text-xs text-white/40">
            {error ? `Error: ${error}` : syncLabel}
          </span>
          {perm === "unsupported" && <span className="text-[10px] text-white/20">Push not supported</span>}
        </div>
        <div className="flex items-center gap-2">
          {perm !== "unsupported" && (
            perm !== "granted" ? (
              <button
                onClick={requestPermission}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <Bell className="w-3.5 h-3.5" /> Enable alerts
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0071c5] border border-[#0071c5]/20 rounded-lg transition-all disabled:opacity-60"
              >
                <Bell className="w-3.5 h-3.5" /> Alerts on
              </button>
            )
          )}
          <button
            onClick={sync}
            disabled={syncing || !online}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync to Cloud"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {upcoming.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-200">
                {upcoming.length} filing{upcoming.length !== 1 ? "s" : ""} due within 90 days
              </p>
              <p className="text-xs text-amber-300/60 mt-1">Review your entities below and complete filings to avoid penalties.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Entities" value={String(entities.length)} />
        <StatCard label="States" value={String(new Set(entities.map((e: any) => e.state)).size)} />
        <StatCard label="Active Filings" value={String(allFilings.filter((f) => !f.completed).length)} />
        <StatCard label="Due &lt; 30d" value={String(upcoming.filter((f) => daysUntil(f.dueDate) < 30).length)} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Entity
        </button>
        <button onClick={exportAllICS}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export Calendar (.ics)
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Entity name" value={newEntity.name || ""}
              onChange={(e) => setNewEntity((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#0071c5]" />
            <select value={newEntity.type} onChange={(e) => setNewEntity((p) => ({ ...p, type: e.target.value as any }))}
              className="px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#0071c5]"
            >
              {ENTITY_TYPES.map((t) => <option key={t} value={t} className="bg-[#0f1115]">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={newEntity.state} onChange={(e) => setNewEntity((p) => ({ ...p, state: e.target.value }))}
              className="px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#0071c5]"
            >
              {ALL_STATES.map((s) => <option key={s.value} value={s.value} className="bg-[#0f1115]">{s.label}</option>)}
            </select>
            <input type="date" value={newEntity.formationDate}
              onChange={(e) => setNewEntity((p) => ({ ...p, formationDate: e.target.value }))}
              className="px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#0071c5]" />
          </div>
          <input placeholder="EIN (optional)" value={newEntity.ein || ""}
            onChange={(e) => setNewEntity((p) => ({ ...p, ein: e.target.value }))}
            className="px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#0071c5]" />
          <div className="flex gap-2">
            <button onClick={addEntity} className="px-4 py-2 bg-[#0071c5] text-white text-sm font-medium rounded-lg hover:bg-[#0071c5]/80 transition-colors">Save Entity</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#0071c5]" /> Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {upcoming.slice(0, 5).map((f: Filing) => {
              const entity = entities.find((e: Entity) => e.id === f.entityId);
              const d = daysUntil(f.dueDate);
              return (
                <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${d < 0 ? "bg-red-400" : d <= 7 ? "bg-amber-400" : "bg-emerald-400"}`} />
                    <span className="text-xs text-white">{entity?.name}</span>
                    <span className="text-xs text-white/40">· {f.type}</span>
                  </div>
                  <span className={`text-xs font-medium ${d < 0 ? "text-red-400" : d <= 7 ? "text-amber-400" : "text-emerald-400"}`}>
                    {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d left`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Entities */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Business Entities</h2>
        <div className="space-y-3">
          {entities.map((entity: Entity) => {
            const rules = getStateRule(entity.state);
            const filings = getFilingsForEntity(entity, rules);
            filings.forEach((item) => { item.completed = !!completions[item.id]; });
            const isExpanded = expandedEntity === entity.id;
            const overdue = filings.filter((f) => !f.completed && f.dueDate !== "Ongoing" && daysUntil(f.dueDate) < 0).length;
            return (
              <div key={entity.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedEntity(isExpanded ? null : entity.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0071c5]/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#0071c5]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{entity.name}</p>
                      <p className="text-xs text-white/40">{entity.type} · {rules.state} · Formed {new Date(entity.formationDate).getFullYear()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {overdue > 0 && <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400">{overdue} overdue</span>}
                    <button onClick={(e) => { e.stopPropagation(); removeEntity(entity.id); }} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); exportEntityICS(entity); }} className="text-white/20 hover:text-[#0071c5] transition-colors"><CalendarCheck className="w-4 h-4" /></button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-white/[0.04] p-4 space-y-3">
                    {entity.ein && <p className="text-xs text-white/30">EIN: {entity.ein}</p>}
                    {entity.notes && <p className="text-xs text-white/30">{entity.notes}</p>}
                    <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mt-2">Required Filings</h4>
                    {filings.map((filing: Filing) => {
                      const days = daysUntil(filing.dueDate);
                      const isOverdue = days < 0 && filing.dueDate !== "Ongoing";
                      const isUrgent = days >= 0 && days <= 30 && filing.dueDate !== "Ongoing";
                      return (
                        <div key={filing.id} className={`flex items-start gap-3 p-3 rounded-xl border ${isOverdue ? "bg-red-500/5 border-red-500/10" : isUrgent ? "bg-amber-500/5 border-amber-500/10" : "bg-white/[0.02] border-white/[0.04]"}`}
                        >
                          <button onClick={() => toggleFiling(filing.id)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${filing.completed ? "bg-[#0071c5] border-[#0071c5]" : "border-white/20 hover:border-white/40"}`}
                          >
                            {filing.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-white">{filing.type}</span>
                              <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : isUrgent ? "text-amber-400" : "text-white/40"}`}>
                                {filing.dueDate === "Ongoing" ? "Ongoing" : isOverdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className="text-xs text-white/40">Cost: {filing.cost}</span>
                              <span className="text-xs text-white/40">Late: {filing.lateFee}</span>
                              {filing.link && (
                                <a href={filing.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0071c5] hover:text-[#00aeef] transition-colors"
                                >
                                  File now <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <div className="mt-1 flex items-start gap-1">
                              <Info className="w-3 h-3 text-white/20 shrink-0 mt-0.5" />
                              <p className="text-xs text-white/25 leading-relaxed">{filing.notes}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* State Reference */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-3">State Compliance Reference</h3>
        <p className="text-xs text-white/40 mb-3">Click any state to view detailed filing rules, costs, deadlines, and guidance.</p>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {ALL_STATES.map((s) => (
            <button key={s.value} onClick={() => setShowDetail(getStateRule(s.value))}
              className="px-1.5 py-1.5 text-xs font-medium text-white/40 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg transition-all text-center"
            >{s.value}</button>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDetail(null)}>
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#0f1115] border border-white/[0.08]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{showDetail.state} ({showDetail.abbrev})</h3>
              <button onClick={() => setShowDetail(null)} className="text-white/20 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-white/60">Annual Report</p>
                <p className="text-white">{showDetail.annualReport.required ? `Required — ${showDetail.annualReport.frequency}` : "Not required"}</p>
                <p className="text-white/40 text-xs mt-1">Due: {showDetail.annualReport.dueDate}</p>
                <p className="text-white/40 text-xs">Cost: ${showDetail.annualReport.cost} | Late: ${showDetail.annualReport.lateFee}</p>
                <p className="text-white/25 text-xs mt-1">{showDetail.annualReport.notes}</p>
              </div>
              {showDetail.franchiseTax?.required && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <p className="text-white/60">Franchise Tax</p>
                  <p className="text-white/40 text-xs">Due: {showDetail.franchiseTax.dueDate}</p>
                  <p className="text-white/40 text-xs">Cost: {showDetail.franchiseTax.cost}</p>
                  <p className="text-white/25 text-xs mt-1">{showDetail.franchiseTax.notes}</p>
                  {showDetail.franchiseTax.link && <a href={showDetail.franchiseTax.link} target="_blank" className="text-xs text-[#0071c5] hover:text-[#00aeef] mt-1 inline-flex items-center gap-1">File now <ExternalLink className="w-3 h-3"/></a>}
                </div>
              )}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-white/60">Registered Agent</p>
                <p className="text-white/40 text-xs">{showDetail.registeredAgent.required ? "Required" : "Optional / varies"}</p>
                <p className="text-white/25 text-xs mt-1">{showDetail.registeredAgent.notes}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-white/60">Foreign Qualification</p>
                <p className="text-white/40 text-xs">Cost: ${showDetail.foreignQualification.cost}</p>
                <p className="text-white/25 text-xs mt-1">{showDetail.foreignQualification.notes}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  );
}
