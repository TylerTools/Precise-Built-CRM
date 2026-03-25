"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { STAGES } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";

interface Project {
  id: string;
  jobType: string;
  stage: string;
  address: string;
  value: number | null;
  createdAt: string;
  archived: boolean;
  contact: { name: string; phone: string; email: string };
  assignedUser: { name: string } | null;
}

const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

function ProjectList() {
  const searchParams = useSearchParams();
  const stageFilter = searchParams.get("stage");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(stageFilter);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveFilter(stageFilter);
  }, [stageFilter]);

  const showArchived = activeFilter === "ARCHIVED";
  const filtered = showArchived
    ? projects.filter((p) => p.archived)
    : activeFilter
    ? projects.filter((p) => p.stage === activeFilter && !p.archived)
    : projects.filter((p) => !p.archived);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Projects</h1>
          <p className="text-sm text-zinc-500 font-mono">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            {activeFilter ? ` in ${STAGE_MAP[activeFilter as StageKey]?.shortLabel || activeFilter}` : ""}
          </p>
        </div>
      </div>

      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter(null)}
          className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
            !activeFilter
              ? "border-brand-500 bg-brand-500/15 text-brand-400"
              : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
          }`}
        >
          All ({projects.filter((p) => !p.archived).length})
        </button>
        {STAGES.map((s) => {
          const count = projects.filter((p) => p.stage === s.key && !p.archived).length;
          return (
            <button
              key={s.key}
              onClick={() => setActiveFilter(activeFilter === s.key ? null : s.key)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                activeFilter === s.key
                  ? "border-brand-500 bg-brand-500/15 text-brand-400"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
              }`}
            >
              {s.shortLabel} ({count})
            </button>
          );
        })}
        {projects.some((p) => p.archived) && (
          <button
            onClick={() => setActiveFilter(activeFilter === "ARCHIVED" ? null : "ARCHIVED")}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
              activeFilter === "ARCHIVED"
                ? "border-red-500 bg-red-500/15 text-red-400"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
            }`}
          >
            Archived ({projects.filter((p) => p.archived).length})
          </button>
        )}
      </div>

      {/* Project list */}
      {loading ? (
        <div className="text-center py-20 text-zinc-500 font-mono text-sm">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-2">No projects found.</p>
          <p className="text-sm text-zinc-600">
            Projects are created from leads via the contact form or added manually.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((project) => {
            const stage = STAGE_MAP[project.stage as StageKey];
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 glass-card-hover p-4 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      stage?.color || "bg-zinc-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-200 truncate">
                        {project.contact.name}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          stage
                            ? `${stage.color}/20 ${stage.textColor}`
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {stage?.shortLabel || project.stage}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      {project.jobType}
                      {project.address ? ` · ${project.address}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 sm:shrink-0 pl-5 sm:pl-0">
                  {project.assignedUser && (
                    <span>{project.assignedUser.name}</span>
                  )}
                  {project.value != null && project.value > 0 && (
                    <span className="font-mono text-zinc-400">
                      ${project.value.toLocaleString()}
                    </span>
                  )}
                  <span className="font-mono">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-zinc-500 font-mono text-sm">Loading...</div>
        </div>
      }
    >
      <ProjectList />
    </Suspense>
  );
}
