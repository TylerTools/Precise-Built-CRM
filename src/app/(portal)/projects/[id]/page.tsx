"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { STAGES, STAGE_MAP, getNextStage, getPrevStage } from "@/lib/stages";
import type { StageKey, StageDefinition } from "@/lib/stages";

// ─── Types ───────────────────────────────────────────────────
interface Task {
  id: string;
  label: string;
  completed: boolean;
  isChecklist: boolean;
  stage: string | null;
  sortOrder: number;
}

interface FileRecord {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

interface ChangeOrder {
  id: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface PurchaseOrder {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  note: string;
  user: { name: string };
}

interface Project {
  id: string;
  jobType: string;
  stage: string;
  address: string;
  scope: string;
  value: number | null;
  notes: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  contact: { id: string; name: string; phone: string; email: string };
  assignedUser: { id: string; name: string; email: string } | null;
  tasks: Task[];
  files: FileRecord[];
  changeOrders: ChangeOrder[];
  purchaseOrders: PurchaseOrder[];
  timeEntries: TimeEntry[];
}

type Tab = "overview" | "checklist" | "tasks" | "financials" | "files";

// ─── Component ───────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState("");

  const fetchProject = useCallback(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setNotes(data.notes);
        setLoading(false);
      })
      .catch(() => {
        router.push("/projects");
      });
  }, [params.id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  const currentStage = STAGE_MAP[project.stage as StageKey];
  const nextStageKey = getNextStage(project.stage as StageKey);
  const prevStageKey = getPrevStage(project.stage as StageKey);

  // Exit checklist for current stage
  const checklistItems = currentStage
    ? project.tasks.filter(
        (t) => t.isChecklist && t.stage === currentStage.key
      )
    : [];
  const checklistComplete =
    checklistItems.length > 0 &&
    checklistItems.every((t) => t.completed);

  // Custom tasks (non-checklist)
  const customTasks = project.tasks.filter((t) => !t.isChecklist);

  // ── Handlers ──────────────────────────────────────────────
  const advanceStage = async () => {
    if (!nextStageKey || !checklistComplete) return;
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: nextStageKey }),
    });
    fetchProject();
  };

  const revertStage = async () => {
    if (!prevStageKey) return;
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: prevStageKey }),
    });
    fetchProject();
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, completed: !completed }),
    });
    fetchProject();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: params.id, label: newTask }),
    });
    setNewTask("");
    fetchProject();
  };

  const deleteTask = async (taskId: string) => {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    fetchProject();
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", params.id as string);
    await fetch("/api/upload", { method: "POST", body: formData });
    fetchProject();
    e.target.value = "";
  };

  const seedChecklist = async () => {
    if (!currentStage) return;
    await fetch("/api/tasks/seed-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: params.id,
        stage: currentStage.key,
      }),
    });
    fetchProject();
  };

  // ── Tabs ──────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "checklist", label: "Checklist" },
    { key: "tasks", label: "Tasks" },
    { key: "financials", label: "Financials" },
    { key: "files", label: "Files" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/projects")}
        className="text-xs font-mono text-zinc-500 hover:text-brand-400 transition-colors mb-4 inline-block"
      >
        ← Projects
      </button>

      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white mb-1">
            {project.contact.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {project.jobType}
            {project.address ? ` · ${project.address}` : ""}
          </p>
        </div>

        {/* Stage badge + advancement */}
        <div className="flex items-center gap-3">
          {prevStageKey && (
            <button
              onClick={revertStage}
              className="text-xs font-mono px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
            >
              ← {prevStageKey}
            </button>
          )}
          <div
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              currentStage
                ? `${currentStage.color}/20 ${currentStage.textColor}`
                : "bg-zinc-700 text-zinc-300"
            }`}
          >
            {currentStage?.key || project.stage} ·{" "}
            {currentStage?.label || project.stage}
          </div>
          {nextStageKey && (
            <button
              onClick={advanceStage}
              disabled={!checklistComplete}
              className={`text-xs font-mono px-3 py-2 rounded-lg transition-colors ${
                checklistComplete
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed"
              }`}
              title={
                checklistComplete
                  ? `Advance to ${nextStageKey}`
                  : "Complete exit checklist first"
              }
            >
              {nextStageKey} →
            </button>
          )}
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="flex gap-1 mb-8">
        {STAGES.map((s) => {
          const stageIdx = STAGES.findIndex((st) => st.key === project.stage);
          const thisIdx = STAGES.findIndex((st) => st.key === s.key);
          const isPast = thisIdx < stageIdx;
          const isCurrent = s.key === project.stage;
          return (
            <div
              key={s.key}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                isCurrent
                  ? s.color
                  : isPast
                  ? "bg-brand-500/60"
                  : "bg-zinc-800"
              }`}
              title={`${s.key} — ${s.label}`}
            />
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {tab.key === "checklist" && checklistItems.length > 0 && (
              <span className="ml-2 text-[10px] font-mono">
                {checklistItems.filter((t) => t.completed).length}/
                {checklistItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Scope */}
              {project.scope && (
                <Card title="Scope of Work">
                  <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
                    {project.scope}
                  </p>
                </Card>
              )}

              {/* Notes */}
              <Card title="Internal Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
                  placeholder="Add notes about this project..."
                />
                <button
                  onClick={saveNotes}
                  disabled={saving}
                  className="mt-2 text-xs font-mono text-brand-400 hover:text-brand-300"
                >
                  {saving ? "Saving..." : "Save Notes"}
                </button>
              </Card>

              {/* Quick checklist preview */}
              {checklistItems.length > 0 && (
                <Card
                  title={`${currentStage?.key} Exit Checklist`}
                  action={
                    <span className="text-[10px] font-mono text-zinc-600">
                      {checklistItems.filter((t) => t.completed).length}/
                      {checklistItems.length}
                    </span>
                  }
                >
                  <div className="space-y-2">
                    {checklistItems.map((task) => (
                      <ChecklistRow
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                      />
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === "checklist" && (
            <Card
              title={`${currentStage?.key || ""} Exit Checklist`}
              action={
                checklistItems.length === 0 ? (
                  <button
                    onClick={seedChecklist}
                    className="text-xs font-mono text-brand-400 hover:text-brand-300"
                  >
                    + Generate Checklist
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-600">
                    {checklistItems.filter((t) => t.completed).length}/
                    {checklistItems.length}
                  </span>
                )
              }
            >
              {checklistItems.length === 0 ? (
                <p className="text-sm text-zinc-600 py-4 text-center">
                  No checklist items for this stage yet. Click &quot;Generate
                  Checklist&quot; to create them from the SOP template.
                </p>
              ) : (
                <div className="space-y-2">
                  {checklistItems.map((task) => (
                    <ChecklistRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                    />
                  ))}
                </div>
              )}

              {checklistComplete && nextStageKey && (
                <div className="mt-6 p-4 rounded-lg bg-brand-500/10 border border-brand-500/30">
                  <p className="text-sm text-brand-400 mb-3">
                    All checklist items complete. Ready to advance.
                  </p>
                  <button
                    onClick={advanceStage}
                    className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                  >
                    Advance to {nextStageKey} →{" "}
                    {STAGE_MAP[nextStageKey]?.shortLabel}
                  </button>
                </div>
              )}
            </Card>
          )}

          {activeTab === "tasks" && (
            <Card title="Tasks">
              <div className="space-y-2 mb-4">
                {customTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group"
                  >
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? "bg-brand-500 border-brand-500"
                          : "border-zinc-600 hover:border-brand-500"
                      }`}
                    >
                      {task.completed && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.completed
                          ? "line-through text-zinc-600"
                          : "text-zinc-300"
                      }`}
                    >
                      {task.label}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {customTasks.length === 0 && (
                  <p className="text-sm text-zinc-600 py-2">
                    No custom tasks yet.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Add a task..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={addTask}
                  className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
            </Card>
          )}

          {activeTab === "financials" && (
            <FinancialsTab
              project={project}
              onRefresh={fetchProject}
            />
          )}

          {activeTab === "files" && (
            <Card title="Photos & Files">
              {project.files.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {project.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {file.filename.match(
                        /\.(jpg|jpeg|png|webp|gif)$/i
                      ) ? (
                        <img
                          src={file.url}
                          alt={file.filename}
                          className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                        />
                      ) : (
                        <div className="w-full h-32 bg-zinc-800 rounded-lg border border-zinc-700 flex items-center justify-center text-xs text-zinc-500 font-mono">
                          {file.filename}
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-600 mb-4">
                  No files uploaded yet.
                </p>
              )}
              <label className="inline-flex items-center gap-2 text-sm font-mono text-brand-400 hover:text-brand-300 cursor-pointer border border-zinc-700 rounded-lg px-4 py-2 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload File
                <input
                  type="file"
                  onChange={uploadFile}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
            </Card>
          )}
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card title="Client">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-zinc-200">
                {project.contact.name}
              </p>
              <p>
                <a
                  href={`tel:${project.contact.phone.replace(/\D/g, "")}`}
                  className="text-brand-400 hover:text-brand-300"
                >
                  {project.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${project.contact.email}`}
                  className="text-brand-400 hover:text-brand-300"
                >
                  {project.contact.email}
                </a>
              </p>
            </div>
          </Card>

          {/* Project Details */}
          <Card title="Details">
            <div className="space-y-3 text-sm">
              <DetailRow label="Type" value={project.jobType} />
              {project.address && (
                <DetailRow label="Address" value={project.address} />
              )}
              {project.value != null && project.value > 0 && (
                <DetailRow
                  label="Value"
                  value={`$${project.value.toLocaleString()}`}
                />
              )}
              {project.assignedUser && (
                <DetailRow
                  label="Assigned"
                  value={project.assignedUser.name}
                />
              )}
              {project.startDate && (
                <DetailRow
                  label="Start"
                  value={new Date(project.startDate).toLocaleDateString()}
                />
              )}
              {project.endDate && (
                <DetailRow
                  label="End"
                  value={new Date(project.endDate).toLocaleDateString()}
                />
              )}
              <DetailRow
                label="Created"
                value={new Date(project.createdAt).toLocaleDateString()}
              />
            </div>
          </Card>

          {/* Financial Summary */}
          {(project.value || (project.changeOrders || []).length > 0) && (
            <Card title="Financial Summary">
              <div className="space-y-2 text-sm font-mono">
                {project.value != null && project.value > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Contract</span>
                    <span className="text-zinc-300">
                      ${project.value.toLocaleString()}
                    </span>
                  </div>
                )}
                {(project.changeOrders || []).filter(
                  (co) => co.status === "approved"
                ).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Change Orders</span>
                    <span className="text-green-400">
                      +$
                      {project.changeOrders
                        .filter((co) => co.status === "approved")
                        .reduce((s, co) => s + co.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}
                {(project.purchaseOrders || []).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Material Cost</span>
                    <span className="text-zinc-400">
                      $
                      {project.purchaseOrders
                        .reduce((s, po) => s + po.amount, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}
                {(project.timeEntries || []).length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hours Logged</span>
                    <span className="text-zinc-400">
                      {project.timeEntries.reduce(
                        (s, te) => s + te.hours,
                        0
                      )}
                      h
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function ChecklistRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(task.id, task.completed)}
      className="flex items-start gap-3 w-full text-left py-1.5 group"
    >
      <span
        className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
          task.completed
            ? "bg-brand-500 border-brand-500"
            : "border-zinc-600 group-hover:border-brand-500"
        }`}
      >
        {task.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span
        className={`text-sm leading-relaxed ${
          task.completed ? "line-through text-zinc-600" : "text-zinc-300"
        }`}
      >
        {task.label}
      </span>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-zinc-600 text-xs font-mono">{label}</span>
      <p className="text-zinc-300">{value}</p>
    </div>
  );
}

// ─── Financials Tab ──────────────────────────────────────────
function FinancialsTab({
  project,
  onRefresh,
}: {
  project: Project;
  onRefresh: () => void;
}) {
  // ── Change Order form state
  const [coDesc, setCoDesc] = useState("");
  const [coAmount, setCoAmount] = useState("");
  const [coStatus, setCoStatus] = useState("pending");
  const [coSaving, setCoSaving] = useState(false);

  // ── Purchase Order form state
  const [poVendor, setPoVendor] = useState("");
  const [poDesc, setPoDesc] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [poStatus, setPoStatus] = useState("pending");
  const [poSaving, setPoSaving] = useState(false);

  // ── Time Entry form state
  const [teDate, setTeDate] = useState(new Date().toISOString().split("T")[0]);
  const [teHours, setTeHours] = useState("");
  const [teNote, setTeNote] = useState("");
  const [teSaving, setTeSaving] = useState(false);

  const addChangeOrder = async () => {
    if (!coDesc.trim() || !coAmount) return;
    setCoSaving(true);
    await fetch("/api/change-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        description: coDesc.trim(),
        amount: coAmount,
        status: coStatus,
      }),
    });
    setCoDesc("");
    setCoAmount("");
    setCoStatus("pending");
    setCoSaving(false);
    onRefresh();
  };

  const addPurchaseOrder = async () => {
    if (!poVendor.trim() || !poDesc.trim() || !poAmount) return;
    setPoSaving(true);
    await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        vendor: poVendor.trim(),
        description: poDesc.trim(),
        amount: poAmount,
        status: poStatus,
      }),
    });
    setPoVendor("");
    setPoDesc("");
    setPoAmount("");
    setPoStatus("pending");
    setPoSaving(false);
    onRefresh();
  };

  const addTimeEntry = async () => {
    if (!teDate || !teHours) return;
    setTeSaving(true);
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        date: teDate,
        hours: teHours,
        note: teNote.trim(),
      }),
    });
    setTeDate(new Date().toISOString().split("T")[0]);
    setTeHours("");
    setTeNote("");
    setTeSaving(false);
    onRefresh();
  };

  const coTotal = (project.changeOrders || [])
    .filter((co) => co.status === "approved")
    .reduce((s, co) => s + co.amount, 0);
  const poTotal = (project.purchaseOrders || []).reduce(
    (s, po) => s + po.amount,
    0
  );
  const teTotal = (project.timeEntries || []).reduce(
    (s, te) => s + te.hours,
    0
  );
  const contractValue = project.value || 0;
  const grandTotal = contractValue + coTotal;

  const inputCls =
    "rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <>
      {/* Change Orders */}
      <Card title="Change Orders">
        {(project.changeOrders || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {project.changeOrders.map((co) => (
              <div
                key={co.id}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm text-zinc-300">{co.description}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {co.status} &middot;{" "}
                    {new Date(co.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm ${
                    co.status === "approved"
                      ? "text-green-400"
                      : co.status === "rejected"
                      ? "text-red-400"
                      : "text-zinc-400"
                  }`}
                >
                  ${co.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-3 pt-2 border-t border-zinc-800">
              <span className="text-xs font-mono text-zinc-500">
                Approved Total
              </span>
              <span className="text-sm font-mono text-green-400">
                +${coTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {/* Inline form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={coDesc}
            onChange={(e) => setCoDesc(e.target.value)}
            placeholder="Description"
            className={`flex-1 ${inputCls}`}
          />
          <input
            type="number"
            value={coAmount}
            onChange={(e) => setCoAmount(e.target.value)}
            placeholder="Amount"
            className={`w-28 font-mono ${inputCls}`}
            min="0"
            step="0.01"
          />
          <select
            value={coStatus}
            onChange={(e) => setCoStatus(e.target.value)}
            className={`w-32 ${inputCls}`}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={addChangeOrder}
            disabled={coSaving || !coDesc.trim() || !coAmount}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {coSaving ? "..." : "Add CO"}
          </button>
        </div>
      </Card>

      {/* Purchase Orders */}
      <Card title="Purchase Orders">
        {(project.purchaseOrders || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {project.purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm text-zinc-300">{po.description}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {po.vendor} &middot; {po.status} &middot;{" "}
                    {new Date(po.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-mono text-sm text-zinc-400">
                  ${po.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex justify-between px-3 pt-2 border-t border-zinc-800">
              <span className="text-xs font-mono text-zinc-500">
                Total Material Cost
              </span>
              <span className="text-sm font-mono text-zinc-400">
                ${poTotal.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {/* Inline form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={poVendor}
            onChange={(e) => setPoVendor(e.target.value)}
            placeholder="Vendor"
            className={`w-32 ${inputCls}`}
          />
          <input
            type="text"
            value={poDesc}
            onChange={(e) => setPoDesc(e.target.value)}
            placeholder="Description"
            className={`flex-1 ${inputCls}`}
          />
          <input
            type="number"
            value={poAmount}
            onChange={(e) => setPoAmount(e.target.value)}
            placeholder="Amount"
            className={`w-28 font-mono ${inputCls}`}
            min="0"
            step="0.01"
          />
          <select
            value={poStatus}
            onChange={(e) => setPoStatus(e.target.value)}
            className={`w-32 ${inputCls}`}
          >
            <option value="pending">Pending</option>
            <option value="ordered">Ordered</option>
            <option value="received">Received</option>
          </select>
          <button
            onClick={addPurchaseOrder}
            disabled={poSaving || !poVendor.trim() || !poDesc.trim() || !poAmount}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {poSaving ? "..." : "Add PO"}
          </button>
        </div>
      </Card>

      {/* Time Entries */}
      <Card title="Time Log">
        {(project.timeEntries || []).length > 0 && (
          <div className="space-y-2 mb-4">
            {project.timeEntries.map((te) => (
              <div
                key={te.id}
                className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
              >
                <div>
                  <p className="text-sm text-zinc-300">{te.user.name}</p>
                  <p className="text-xs text-zinc-600 font-mono">
                    {new Date(te.date).toLocaleDateString()}
                    {te.note ? ` · ${te.note}` : ""}
                  </p>
                </div>
                <span className="font-mono text-sm text-zinc-400">
                  {te.hours}h
                </span>
              </div>
            ))}
            <div className="flex justify-between px-3 pt-2 border-t border-zinc-800">
              <span className="text-xs font-mono text-zinc-500">
                Total Hours
              </span>
              <span className="text-sm font-mono text-zinc-400">
                {teTotal}h
              </span>
            </div>
          </div>
        )}
        {/* Inline form */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={teDate}
            onChange={(e) => setTeDate(e.target.value)}
            className={`w-36 font-mono ${inputCls}`}
          />
          <input
            type="number"
            value={teHours}
            onChange={(e) => setTeHours(e.target.value)}
            placeholder="Hours"
            className={`w-24 font-mono ${inputCls}`}
            min="0"
            step="0.25"
          />
          <input
            type="text"
            value={teNote}
            onChange={(e) => setTeNote(e.target.value)}
            placeholder="Notes (optional)"
            className={`flex-1 ${inputCls}`}
          />
          <button
            onClick={addTimeEntry}
            disabled={teSaving || !teDate || !teHours}
            className="px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {teSaving ? "..." : "Log Time"}
          </button>
        </div>
      </Card>

      {/* Grand Total Summary */}
      <Card title="Project Financial Summary">
        <div className="space-y-2.5 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Contract Value</span>
            <span className="text-zinc-200">
              ${contractValue.toLocaleString()}
            </span>
          </div>
          {coTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">
                + Approved Change Orders
              </span>
              <span className="text-green-400">
                +${coTotal.toLocaleString()}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-zinc-800">
            <span className="text-zinc-300 font-semibold">
              Adjusted Contract
            </span>
            <span className="text-white font-semibold">
              ${grandTotal.toLocaleString()}
            </span>
          </div>
          {poTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500">
                - Material Costs (POs)
              </span>
              <span className="text-red-400">
                -${poTotal.toLocaleString()}
              </span>
            </div>
          )}
          {(poTotal > 0 || coTotal > 0) && (
            <div className="flex justify-between pt-2 border-t border-zinc-800">
              <span className="text-zinc-300 font-semibold">
                Gross Margin
              </span>
              <span
                className={`font-semibold ${
                  grandTotal - poTotal >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                ${(grandTotal - poTotal).toLocaleString()}
              </span>
            </div>
          )}
          {teTotal > 0 && (
            <div className="flex justify-between text-zinc-500 text-xs pt-1">
              <span>Hours Logged</span>
              <span>{teTotal}h</span>
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
