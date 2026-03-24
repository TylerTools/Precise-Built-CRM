"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGES } from "@/lib/stages";
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
  email: string;
  role: string;
}

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

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

  const salesProjects = projects.filter((p) => p.stage.startsWith("S"));
  const opsProjects = projects.filter((p) => p.stage.startsWith("O"));
  const activeProjects = projects.filter((p) => p.stage !== "O5");

  const totalPipelineValue = salesProjects.reduce(
    (sum, p) => sum + (p.value || 0),
    0
  );
  const totalActiveValue = opsProjects
    .filter((p) => p.stage !== "O5")
    .reduce((sum, p) => sum + (p.value || 0), 0);

  // My incomplete tasks across all projects
  const myTasks: { task: Task; project: Project }[] = [];
  for (const p of projects) {
    for (const t of p.tasks) {
      if (!t.completed) {
        myTasks.push({ task: t, project: p });
      }
    }
  }
  // Group tasks by project
  const tasksByProject = new Map<string, { project: Project; tasks: Task[] }>();
  for (const { task, project } of myTasks) {
    const entry = tasksByProject.get(project.id);
    if (entry) {
      entry.tasks.push(task);
    } else {
      tasksByProject.set(project.id, { project, tasks: [task] });
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, completed: !completed }),
    });
    // Refresh projects
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
          <h1 className="text-2xl font-syne font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 font-mono">
            {activeProjects.length} active project
            {activeProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNewLead(true)}
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          sub={`${salesProjects.length} in sales`}
          accent
        />
        <KpiCard
          label="Active Jobs"
          value={String(opsProjects.filter((p) => p.stage !== "O5").length)}
          sub={`$${totalActiveValue.toLocaleString()} value`}
        />
        <KpiCard
          label="Total Projects"
          value={String(projects.length)}
          sub={`${projects.filter((p) => p.stage === "O5").length} completed`}
        />
        <KpiCard
          label="Open Tasks"
          value={String(myTasks.length)}
          sub={`across ${tasksByProject.size} project${tasksByProject.size !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Pipeline Column View */}
      <div className="mb-8">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          Pipeline
        </h2>
        <div className="overflow-x-auto -mx-4 px-4 pb-2">
          <div className="flex gap-3" style={{ minWidth: `${STAGES.length * 180}px` }}>
            {STAGES.map((stage) => {
              const stageProjects = projects.filter((p) => p.stage === stage.key);
              return (
                <div
                  key={stage.key}
                  className="flex-1 min-w-[160px] rounded-xl border border-zinc-800/80 p-3"
                  style={{ backgroundColor: "#161617" }}
                >
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${stage.color} shrink-0`} />
                    <span className="text-[11px] font-mono text-zinc-400 truncate">
                      {stage.key}
                    </span>
                    <span className="ml-auto text-[11px] font-mono text-zinc-600">
                      {stageProjects.length}
                    </span>
                  </div>

                  {/* Project cards */}
                  <div className="space-y-2">
                    {stageProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block rounded-lg border border-zinc-800 p-2.5 hover:border-zinc-600 transition-colors group"
                        style={{ backgroundColor: "#1c1c1e" }}
                      >
                        <p className="text-xs font-medium text-zinc-200 truncate group-hover:text-white">
                          {project.contact.name}
                        </p>
                        <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                          {project.jobType}
                        </p>
                        {project.value != null && project.value > 0 && (
                          <p className="text-[11px] font-mono text-brand-400 mt-1">
                            ${project.value.toLocaleString()}
                          </p>
                        )}
                      </Link>
                    ))}
                    {stageProjects.length === 0 && (
                      <div className="text-center py-4">
                        <span className="text-[10px] text-zinc-700 font-mono">empty</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom row: My Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks Widget */}
        <div
          className="rounded-xl border border-zinc-800/80 p-5"
          style={{ backgroundColor: "#161617" }}
        >
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Open Tasks
          </h2>
          {tasksByProject.size === 0 ? (
            <p className="text-sm text-zinc-600 py-6 text-center">
              No open tasks. You&apos;re all caught up.
            </p>
          ) : (
            <div className="space-y-5 max-h-[400px] overflow-y-auto pr-1">
              {Array.from(tasksByProject.entries()).map(
                ([projectId, { project, tasks }]) => (
                  <div key={projectId}>
                    <Link
                      href={`/projects/${projectId}`}
                      className="text-xs font-mono text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      {project.contact.name} &middot; {project.jobType}
                    </Link>
                    <div className="mt-2 space-y-1.5">
                      {tasks.slice(0, 5).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task.id, task.completed)}
                          className="flex items-start gap-2.5 w-full text-left group py-0.5"
                        >
                          <span className="w-4 h-4 mt-0.5 rounded border border-zinc-600 group-hover:border-brand-500 shrink-0 flex items-center justify-center transition-colors" />
                          <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug">
                            {task.label}
                          </span>
                        </button>
                      ))}
                      {tasks.length > 5 && (
                        <Link
                          href={`/projects/${projectId}`}
                          className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 pl-6"
                        >
                          +{tasks.length - 5} more
                        </Link>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-xl border border-zinc-800/80 p-5"
          style={{ backgroundColor: "#161617" }}
        >
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Recent Activity
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-zinc-600 py-6 text-center">
              No projects yet. Click &quot;New Lead&quot; to get started.
            </p>
          ) : (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {projects
                .sort(
                  (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
                )
                .slice(0, 12)
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
          : "border-zinc-800/80"
      }`}
      style={accent ? undefined : { backgroundColor: "#161617" }}
    >
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-syne font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
    </div>
  );
}
