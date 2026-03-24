"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SALES_STAGES, OPS_STAGES, STAGES } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";
import NewLeadModal from "@/components/NewLeadModal";

// ─── Types ──────────────────────────────────────────────────
interface Task {
  id: string;
  label: string;
  completed: boolean;
  isChecklist: boolean;
  stage: string | null;
  projectId: string;
}

interface Project {
  id: string;
  jobType: string;
  stage: string;
  address: string;
  value: number | null;
  createdAt: string;
  updatedAt: string;
  contact: { name: string; phone: string; email: string };
  assignedUser: { name: string } | null;
  tasks: Task[];
}

interface UserSession {
  userId: string;
  name?: string;
  email: string;
  role: string;
}

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewLead, setShowNewLead] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([projectData, userData]) => {
        setProjects(Array.isArray(projectData) ? projectData : []);
        if (userData.user) setUser(userData.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // KPI calculations
  const totalPipelineValue = projects.reduce(
    (sum, p) => sum + (p.value || 0),
    0
  );
  const activeJobs = projects.filter((p) =>
    ["O1", "O2", "O3"].includes(p.stage)
  );
  const openLeads = projects.filter((p) =>
    ["S1", "S2", "S3", "S4"].includes(p.stage)
  );
  const projectsWithValue = projects.filter((p) => p.value && p.value > 0);
  const avgDealValue =
    projectsWithValue.length > 0
      ? projectsWithValue.reduce((sum, p) => sum + (p.value || 0), 0) /
        projectsWithValue.length
      : 0;

  // My incomplete tasks across all projects
  const myTasks: { task: Task; project: Project }[] = [];
  for (const p of projects) {
    for (const t of p.tasks) {
      if (!t.completed) {
        myTasks.push({ task: t, project: p });
      }
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, completed: !completed }),
    });
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            {projects.length} project{projects.length !== 1 ? "s" : ""} in
            pipeline
          </p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-500/20"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Total Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          sub={`${projects.length} total projects`}
          accent
        />
        <KpiCard
          label="Active Jobs"
          value={String(activeJobs.length)}
          sub="O1–O3 in production"
        />
        <KpiCard
          label="Open Leads"
          value={String(openLeads.length)}
          sub="S1–S4 in sales"
        />
        <KpiCard
          label="Avg Deal Value"
          value={
            avgDealValue > 0
              ? `$${Math.round(avgDealValue).toLocaleString()}`
              : "$0"
          }
          sub={`${projectsWithValue.length} with value`}
        />
      </div>

      {/* Two-column: Pipeline Board (60%) + My Tasks (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Pipeline Board — left 60% */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Pipeline Board
          </h2>

          {/* Sales row */}
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
            Sales
          </p>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {SALES_STAGES.map((stage) => {
              const count = projects.filter(
                (p) => p.stage === stage.key
              ).length;
              return (
                <Link
                  key={stage.key}
                  href={`/projects?stage=${stage.key}`}
                  className="rounded-xl border border-zinc-800/80 bg-surface-raised p-3 hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${stage.color} shrink-0`}
                    />
                    <span className="text-[11px] font-mono text-zinc-500">
                      {stage.key}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate leading-snug">
                    {stage.shortLabel}
                  </p>
                  <p className="text-lg font-syne font-bold text-white mt-1">
                    {count}
                  </p>
                </Link>
              );
            })}
          </div>

          {/* Ops row */}
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
            Operations
          </p>
          <div className="grid grid-cols-5 gap-2">
            {OPS_STAGES.map((stage) => {
              const count = projects.filter(
                (p) => p.stage === stage.key
              ).length;
              return (
                <Link
                  key={stage.key}
                  href={`/projects?stage=${stage.key}`}
                  className="rounded-xl border border-zinc-800/80 bg-surface-raised p-3 hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`w-2 h-2 rounded-full ${stage.color} shrink-0`}
                    />
                    <span className="text-[11px] font-mono text-zinc-500">
                      {stage.key}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate leading-snug">
                    {stage.shortLabel}
                  </p>
                  <p className="text-lg font-syne font-bold text-white mt-1">
                    {count}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* My Tasks — right 40% */}
        <div className="lg:col-span-2">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            My Tasks
          </h2>
          <div className="rounded-xl border border-zinc-800/80 bg-surface-raised p-5">
            {myTasks.length === 0 ? (
              <p className="text-sm text-zinc-600 py-6 text-center">
                No open tasks
              </p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {myTasks.slice(0, 20).map(({ task, project }) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id, task.completed)}
                    className="flex items-start gap-2.5 w-full text-left group py-1.5 px-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="w-4 h-4 mt-0.5 rounded border border-zinc-600 group-hover:border-brand-500 shrink-0 flex items-center justify-center transition-colors" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-300 group-hover:text-white transition-colors leading-snug truncate">
                        {task.label}
                      </p>
                      <Link
                        href={`/projects/${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-mono text-zinc-600 hover:text-brand-400 transition-colors"
                      >
                        {project.contact.name} &middot; {project.jobType}
                      </Link>
                    </div>
                  </button>
                ))}
                {myTasks.length > 20 && (
                  <p className="text-[10px] font-mono text-zinc-600 text-center pt-2">
                    +{myTasks.length - 20} more tasks
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h2>
        <div className="rounded-xl border border-zinc-800/80 bg-surface-raised p-5">
          {projects.length === 0 ? (
            <p className="text-sm text-zinc-600 py-6 text-center">
              No projects yet. Click &quot;New Lead&quot; to get started.
            </p>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
              {projects
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
                )
                .slice(0, 10)
                .map((project) => {
                  const stage = STAGE_MAP[project.stage as StageKey];
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          stage?.color || "bg-zinc-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200 truncate">
                            {project.contact.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-600">
                            {stage?.key || project.stage}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate">
                          {project.jobType}
                          {project.address ? ` · ${project.address}` : ""}
                        </p>
                      </div>
                      {project.value != null && project.value > 0 && (
                        <span className="text-sm font-mono text-zinc-400">
                          ${project.value.toLocaleString()}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      <NewLeadModal open={showNewLead} onClose={() => setShowNewLead(false)} />
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-brand-500/30 bg-brand-500/5"
          : "border-zinc-800/80 bg-surface-raised"
      }`}
    >
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-syne font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
    </div>
  );
}
