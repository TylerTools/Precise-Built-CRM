"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { STAGES, SALES_STAGES, OPS_STAGES } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";

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
  tasks: { id: string; completed: boolean }[];
}

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
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

  // Stage counts
  const stageCounts = STAGES.map((s) => ({
    ...s,
    count: projects.filter((p) => p.stage === s.key).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 font-mono">
            {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          View All Projects
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          sub={`${salesProjects.length} in sales`}
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
          label="Avg. Value"
          value={
            projects.length > 0
              ? `$${Math.round(
                  projects.reduce((s, p) => s + (p.value || 0), 0) / projects.length
                ).toLocaleString()}`
              : "$0"
          }
          sub="per project"
        />
      </div>

      {/* Stage Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Pipeline */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Sales Pipeline
          </h2>
          <div className="space-y-2">
            {stageCounts
              .filter((s) => s.division === "SALES")
              .map((s) => (
                <Link
                  key={s.key}
                  href={`/projects?stage=${s.key}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0`} />
                  <span className="text-sm text-zinc-300 flex-1">{s.shortLabel}</span>
                  <span className="text-sm font-mono text-zinc-500 group-hover:text-white transition-colors">
                    {s.count}
                  </span>
                </Link>
              ))}
          </div>
        </div>

        {/* Operations Pipeline */}
        <div className="glass-card p-5">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Operations
          </h2>
          <div className="space-y-2">
            {stageCounts
              .filter((s) => s.division === "OPS")
              .map((s) => (
                <Link
                  key={s.key}
                  href={`/projects?stage=${s.key}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-700/50 transition-colors group"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color} shrink-0`} />
                  <span className="text-sm text-zinc-300 flex-1">{s.shortLabel}</span>
                  <span className="text-sm font-mono text-zinc-500 group-hover:text-white transition-colors">
                    {s.count}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="glass-card p-5">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h2>
        {projects.length === 0 ? (
          <p className="text-sm text-zinc-600 py-8 text-center">
            No projects yet. New leads from the contact form will appear here.
          </p>
        ) : (
          <div className="space-y-1">
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
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-700/50 transition-colors group"
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
                          {stage?.shortLabel || project.stage}
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
  );
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="glass-card p-4">
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-xl font-syne font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
    </div>
  );
}
