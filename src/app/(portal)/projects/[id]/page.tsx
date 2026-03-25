"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { STAGES, STAGE_MAP, getNextStage, getPrevStage } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";

// ─── Types ───────────────────────────────────────────────────
interface TeamUser {
  id: string;
  name: string;
}

interface Task {
  id: string;
  label: string;
  completed: boolean;
  isChecklist: boolean;
  stage: string | null;
  sortOrder: number;
  assignedUserId: string | null;
  assignedUser: TeamUser | null;
  dueDate: string | null;
  priority: string;
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

type Tab = "overview" | "tasks" | "financials" | "files";

// ─── Inline Edit Field ──────────────────────────────────────
function InlineField({
  label,
  value,
  onSave,
  type = "text",
  mono = false,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  return (
    <div>
      <span className="text-zinc-600 text-xs font-mono">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className={`w-full bg-zinc-800 border border-[#c47a4f]/50 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#c47a4f] ${mono ? "font-mono" : ""}`}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className={`text-zinc-300 cursor-pointer hover:text-white hover:bg-zinc-800/50 rounded px-1 -mx-1 transition-colors ${mono ? "font-mono" : ""}`}
        >
          {value || <span className="text-zinc-600 italic">Click to edit</span>}
        </p>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [saving, setSaving] = useState(false);

  // Task form state
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  // Financial form states
  const [coForm, setCoForm] = useState({ description: "", amount: "", status: "pending" });
  const [poForm, setPoForm] = useState({ vendor: "", description: "", amount: "", status: "pending" });
  const [teForm, setTeForm] = useState({ date: "", hours: "", note: "" });

  const fetchProject = useCallback(() => {
    fetch(`/api/projects/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => {
        router.push("/projects");
      });
  }, [params.id, router]);

  useEffect(() => {
    fetchProject();
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTeamUsers(data);
      })
      .catch(() => {});
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
  const customTasks = project.tasks.filter((t) => !t.isChecklist);

  // ── Handlers ──────────────────────────────────────────────
  const patchProject = async (data: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    fetchProject();
  };

  const patchContact = async (data: Record<string, unknown>) => {
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.contact.id, ...data }),
    });
    fetchProject();
  };

  const advanceStage = async () => {
    if (!nextStageKey) return;
    await patchProject({ stage: nextStageKey });
  };

  const revertStage = async () => {
    if (!prevStageKey) return;
    await patchProject({ stage: prevStageKey });
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
    if (!newTaskLabel.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: params.id,
        label: newTaskLabel,
        assignedUserId: newTaskAssignee || undefined,
        dueDate: newTaskDue || undefined,
        priority: newTaskPriority,
      }),
    });
    setNewTaskLabel("");
    setNewTaskAssignee("");
    setNewTaskDue("");
    setNewTaskPriority("medium");
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

  // Financial handlers
  const addChangeOrder = async () => {
    if (!coForm.description || !coForm.amount) return;
    await fetch("/api/change-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: params.id, ...coForm }),
    });
    setCoForm({ description: "", amount: "", status: "pending" });
    fetchProject();
  };

  const deleteChangeOrder = async (id: string) => {
    await fetch("/api/change-orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProject();
  };

  const addPurchaseOrder = async () => {
    if (!poForm.vendor || !poForm.description || !poForm.amount) return;
    await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: params.id, ...poForm }),
    });
    setPoForm({ vendor: "", description: "", amount: "", status: "pending" });
    fetchProject();
  };

  const deletePurchaseOrder = async (id: string) => {
    await fetch("/api/purchase-orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProject();
  };

  const addTimeEntry = async () => {
    if (!teForm.date || !teForm.hours) return;
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: params.id, ...teForm }),
    });
    setTeForm({ date: "", hours: "", note: "" });
    fetchProject();
  };

  const deleteTimeEntry = async (id: string) => {
    await fetch("/api/time-entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchProject();
  };

  // Split contact name for first/last
  const nameParts = project.contact.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Financial totals
  const approvedCOs = (project.changeOrders || []).filter((co) => co.status === "approved");
  const coTotal = approvedCOs.reduce((s, co) => s + co.amount, 0);
  const poTotal = (project.purchaseOrders || []).reduce((s, po) => s + po.amount, 0);
  const hoursTotal = (project.timeEntries || []).reduce((s, te) => s + te.hours, 0);

  // ── Tabs ──────────────────────────────────────────────────
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: "Tasks" },
    { key: "financials", label: "Financials" },
    { key: "files", label: "Files" },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => router.push("/projects")}
        className="text-xs font-mono text-zinc-500 hover:text-[#c47a4f] transition-colors mb-4 inline-block"
      >
        &larr; Projects
      </button>

      {/* Current Stage Name — prominent */}
      <div className="mb-2">
        <span className="text-[#c47a4f] font-syne font-bold text-lg">
          {currentStage?.label || project.stage}
        </span>
        <span className="text-zinc-600 font-mono text-xs ml-3">
          Stage {currentStage?.key || project.stage}
        </span>
        {saving && <span className="text-zinc-600 font-mono text-xs ml-3">Saving...</span>}
      </div>

      {/* Stage Progress Bar — 10 stages */}
      <div className="flex gap-1 mb-3">
        {STAGES.map((s) => {
          const stageIdx = STAGES.findIndex((st) => st.key === project.stage);
          const thisIdx = STAGES.findIndex((st) => st.key === s.key);
          const isPast = thisIdx < stageIdx;
          const isCurrent = s.key === project.stage;
          return (
            <div
              key={s.key}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${s.key} — ${s.label}`}
            >
              <div
                className={`w-full h-2 rounded-full transition-colors ${
                  isCurrent
                    ? "bg-[#c47a4f]"
                    : isPast
                    ? "bg-[#c47a4f]/40"
                    : "bg-zinc-800"
                }`}
              />
              <span
                className={`text-[9px] font-mono ${
                  isCurrent ? "text-[#c47a4f] font-bold" : "text-zinc-600"
                }`}
              >
                {s.key}
              </span>
            </div>
          );
        })}
      </div>

      {/* Advance / Revert buttons */}
      <div className="flex items-center gap-3 mb-6">
        {prevStageKey && (
          <button
            onClick={revertStage}
            className="text-xs font-mono px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
          >
            &larr; Revert to {prevStageKey}
          </button>
        )}
        {nextStageKey && (
          <button
            onClick={advanceStage}
            className="text-xs font-mono px-4 py-2 rounded-lg bg-[#c47a4f] text-white hover:bg-[#b06a3f] transition-colors"
          >
            Advance to {nextStageKey} &rarr;
          </button>
        )}
      </div>

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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-[#c47a4f] text-[#c47a4f]"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "overview" && (
            <>
              {/* Editable Project Fields */}
              <Card title="Project Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InlineField
                    label="Project Name"
                    value={project.scope || ""}
                    onSave={(v) => patchProject({ scope: v })}
                  />
                  <InlineField
                    label="Job Type"
                    value={project.jobType}
                    onSave={(v) => patchProject({ jobType: v })}
                  />
                  <InlineField
                    label="Estimated Value"
                    value={project.value?.toString() || ""}
                    onSave={(v) => patchProject({ value: v })}
                    type="number"
                    mono
                  />
                  <InlineField
                    label="Address"
                    value={project.address}
                    onSave={(v) => patchProject({ address: v })}
                  />
                </div>
              </Card>

              {/* Notes */}
              <Card title="Internal Notes">
                <InlineTextarea
                  value={project.notes}
                  onSave={(v) => patchProject({ notes: v })}
                />
              </Card>

              {/* Contact Info */}
              <Card title="Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InlineField
                    label="First Name"
                    value={firstName}
                    onSave={(v) =>
                      patchContact({ name: `${v} ${lastName}`.trim() })
                    }
                  />
                  <InlineField
                    label="Last Name"
                    value={lastName}
                    onSave={(v) =>
                      patchContact({ name: `${firstName} ${v}`.trim() })
                    }
                  />
                  <InlineField
                    label="Phone"
                    value={project.contact.phone}
                    onSave={(v) => patchContact({ phone: v })}
                    type="tel"
                    mono
                  />
                  <InlineField
                    label="Email"
                    value={project.contact.email}
                    onSave={(v) => patchContact({ email: v })}
                    type="email"
                  />
                </div>
              </Card>
            </>
          )}

          {activeTab === "tasks" && (
            <Card title="Tasks">
              {/* Task list */}
              <div className="space-y-2 mb-6">
                {customTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group bg-zinc-800/30 rounded-lg px-3 py-2"
                  >
                    <button
                      onClick={() => toggleTask(task.id, task.completed)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? "bg-[#c47a4f] border-[#c47a4f]"
                          : "border-zinc-600 hover:border-[#c47a4f]"
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${task.completed ? "line-through text-zinc-600" : "text-zinc-300"}`}>
                        {task.label}
                      </span>
                      <div className="flex items-center gap-3 mt-0.5">
                        {task.assignedUser && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            {task.assignedUser.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-[10px] font-mono text-zinc-500">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`text-[10px] font-mono ${
                          task.priority === "high" ? "text-red-400" :
                          task.priority === "low" ? "text-zinc-600" :
                          "text-zinc-500"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {customTasks.length === 0 && (
                  <p className="text-sm text-zinc-600 py-2">No tasks yet.</p>
                )}
              </div>

              {/* Add task form */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Add Task</p>
                <input
                  type="text"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Task title..."
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  >
                    <option value="">Assignee...</option>
                    {teamUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={(e) => setNewTaskDue(e.target.value)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <button
                  onClick={addTask}
                  className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Add Task
                </button>
              </div>
            </Card>
          )}

          {activeTab === "financials" && (
            <>
              {/* Change Orders */}
              <Card
                title="Change Orders"
                action={
                  approvedCOs.length > 0 ? (
                    <span className="text-xs font-mono text-green-400">
                      Total: ${coTotal.toLocaleString()}
                    </span>
                  ) : undefined
                }
              >
                {(project.changeOrders || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {project.changeOrders.map((co) => (
                      <div key={co.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 group">
                        <div>
                          <p className="text-sm text-zinc-300">{co.description}</p>
                          <p className="text-xs text-zinc-600 font-mono">
                            {co.status} · {new Date(co.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-sm ${
                            co.status === "approved" ? "text-green-400" :
                            co.status === "rejected" ? "text-red-400" :
                            "text-zinc-400"
                          }`}>
                            ${co.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => deleteChangeOrder(co.id)}
                            className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add CO form */}
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Description"
                      value={coForm.description}
                      onChange={(e) => setCoForm({ ...coForm, description: e.target.value })}
                      className="col-span-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={coForm.amount}
                      onChange={(e) => setCoForm({ ...coForm, amount: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={coForm.status}
                      onChange={(e) => setCoForm({ ...coForm, status: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={addChangeOrder} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      Add CO
                    </button>
                  </div>
                </div>
              </Card>

              {/* Purchase Orders */}
              <Card
                title="Purchase Orders"
                action={
                  (project.purchaseOrders || []).length > 0 ? (
                    <span className="text-xs font-mono text-zinc-400">
                      Total: ${poTotal.toLocaleString()}
                    </span>
                  ) : undefined
                }
              >
                {(project.purchaseOrders || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {project.purchaseOrders.map((po) => (
                      <div key={po.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 group">
                        <div>
                          <p className="text-sm text-zinc-300">{po.description}</p>
                          <p className="text-xs text-zinc-600 font-mono">
                            {po.vendor} · {po.status} · {new Date(po.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-zinc-400">${po.amount.toLocaleString()}</span>
                          <button
                            onClick={() => deletePurchaseOrder(po.id)}
                            className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add PO form */}
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      placeholder="Vendor"
                      value={poForm.vendor}
                      onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                    <input
                      placeholder="Description"
                      value={poForm.description}
                      onChange={(e) => setPoForm({ ...poForm, description: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={poForm.amount}
                      onChange={(e) => setPoForm({ ...poForm, amount: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={poForm.status}
                      onChange={(e) => setPoForm({ ...poForm, status: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    >
                      <option value="pending">Pending</option>
                      <option value="ordered">Ordered</option>
                      <option value="received">Received</option>
                    </select>
                    <button onClick={addPurchaseOrder} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      Add PO
                    </button>
                  </div>
                </div>
              </Card>

              {/* Time Entries */}
              <Card
                title="Time Log"
                action={
                  hoursTotal > 0 ? (
                    <span className="text-xs font-mono text-zinc-400">
                      Total: {hoursTotal}h
                    </span>
                  ) : undefined
                }
              >
                {(project.timeEntries || []).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {project.timeEntries.map((te) => (
                      <div key={te.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3 group">
                        <div>
                          <p className="text-sm text-zinc-300">{te.user.name}</p>
                          <p className="text-xs text-zinc-600 font-mono">
                            {new Date(te.date).toLocaleDateString()}
                            {te.note ? ` · ${te.note}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-zinc-400">{te.hours}h</span>
                          <button
                            onClick={() => deleteTimeEntry(te.id)}
                            className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Add TE form */}
                <div className="border-t border-zinc-800 pt-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="date"
                      value={teForm.date}
                      onChange={(e) => setTeForm({ ...teForm, date: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                    <input
                      type="number"
                      placeholder="Hours"
                      value={teForm.hours}
                      onChange={(e) => setTeForm({ ...teForm, hours: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                    <input
                      placeholder="Note"
                      value={teForm.note}
                      onChange={(e) => setTeForm({ ...teForm, note: e.target.value })}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    />
                  </div>
                  <button onClick={addTimeEntry} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Add Entry
                  </button>
                </div>
              </Card>
            </>
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
                      {file.filename.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
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
                <p className="text-sm text-zinc-600 mb-4">No files uploaded yet.</p>
              )}
              <label className="inline-flex items-center gap-2 text-sm font-mono text-[#c47a4f] hover:text-[#d89a6f] cursor-pointer border border-zinc-700 rounded-lg px-4 py-2 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload File
                <input type="file" onChange={uploadFile} className="hidden" accept="image/*,.pdf,.doc,.docx" />
              </label>
            </Card>
          )}
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card title="Client">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-zinc-200">{project.contact.name}</p>
              <p>
                <a href={`tel:${project.contact.phone.replace(/\D/g, "")}`} className="text-[#c47a4f] hover:text-[#d89a6f]">
                  {project.contact.phone}
                </a>
              </p>
              <p>
                <a href={`mailto:${project.contact.email}`} className="text-[#c47a4f] hover:text-[#d89a6f]">
                  {project.contact.email}
                </a>
              </p>
            </div>
          </Card>

          {/* Project Details */}
          <Card title="Details">
            <div className="space-y-3 text-sm">
              <DetailRow label="Type" value={project.jobType} />
              {project.address && <DetailRow label="Address" value={project.address} />}
              {project.value != null && project.value > 0 && (
                <DetailRow label="Value" value={`$${project.value.toLocaleString()}`} />
              )}
              {project.assignedUser && (
                <DetailRow label="Assigned" value={project.assignedUser.name} />
              )}
              {project.startDate && (
                <DetailRow label="Start" value={new Date(project.startDate).toLocaleDateString()} />
              )}
              {project.endDate && (
                <DetailRow label="End" value={new Date(project.endDate).toLocaleDateString()} />
              )}
              <DetailRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
            </div>
          </Card>

          {/* Financial Summary */}
          {(project.value || (project.changeOrders || []).length > 0 || (project.purchaseOrders || []).length > 0) && (
            <Card title="Financial Summary">
              <div className="space-y-2 text-sm font-mono">
                {project.value != null && project.value > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Contract</span>
                    <span className="text-zinc-300">${project.value.toLocaleString()}</span>
                  </div>
                )}
                {coTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Change Orders</span>
                    <span className="text-green-400">+${coTotal.toLocaleString()}</span>
                  </div>
                )}
                {poTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Material Cost</span>
                    <span className="text-zinc-400">${poTotal.toLocaleString()}</span>
                  </div>
                )}
                {hoursTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hours Logged</span>
                    <span className="text-zinc-400">{hoursTotal}h</span>
                  </div>
                )}
                {project.value != null && project.value > 0 && (
                  <>
                    <div className="border-t border-zinc-800 my-1" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-zinc-400">Net</span>
                      <span className="text-white">
                        ${(project.value + coTotal - poTotal).toLocaleString()}
                      </span>
                    </div>
                  </>
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

function InlineTextarea({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft(value);
    setDirty(false);
  }, [value]);

  return (
    <div>
      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty && draft !== value) {
            onSave(draft);
            setDirty(false);
          }
        }}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y"
        placeholder="Add notes about this project..."
      />
      {dirty && (
        <button
          onClick={() => {
            onSave(draft);
            setDirty(false);
          }}
          className="mt-2 text-xs font-mono text-[#c47a4f] hover:text-[#d89a6f]"
        >
          Save Notes
        </button>
      )}
    </div>
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
