"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { STAGES, STAGE_MAP, getNextStage } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";
import MeetingScheduler from "@/components/MeetingScheduler";

// ─── Types ───────────────────────────────────────────────────
interface Project {
  id: string;
  jobType: string;
  stage: string;
  address: string;
  scope: string;
  value: number | null;
  notes: string;
  archived: boolean;
  driveFolderId: string | null;
  driveFolderUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  contact: { id: string; name: string; phone: string; email: string };
  assignedUser: { id: string; name: string; email: string } | null;
}

interface StageDataRecord {
  id: string;
  stage: string;
  data: Record<string, unknown>;
  completedAt: string | null;
}

interface MeetingRecord {
  id: string;
  stage: string;
  title: string;
  scheduledAt: string;
  notes: string | null;
  googleEventUrl: string | null;
}

interface FollowUpRecord {
  id: string;
  attemptNumber: number;
  date: string | null;
  notes: string | null;
  responded: boolean;
}

// ─── Component ───────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [stageDataMap, setStageDataMap] = useState<Record<string, StageDataRecord>>({});
  const [stageDataLoaded, setStageDataLoaded] = useState(false);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingStage, setMeetingStage] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

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
      .catch(() => router.push("/projects"));
  }, [params.id, router]);

  const fetchStageData = useCallback(() => {
    fetch(`/api/projects/${params.id}/stage-data`)
      .then((r) => r.json())
      .then((data: StageDataRecord[]) => {
        const map: Record<string, StageDataRecord> = {};
        if (Array.isArray(data)) data.forEach((sd) => (map[sd.stage] = sd));
        setStageDataMap(map);
        setStageDataLoaded(true);
      })
      .catch(() => { setStageDataLoaded(true); });
  }, [params.id]);

  const fetchMeetings = useCallback(() => {
    fetch(`/api/projects/${params.id}/meetings`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMeetings(data); })
      .catch(() => {});
  }, [params.id]);

  const fetchFollowUps = useCallback(() => {
    fetch(`/api/projects/${params.id}/follow-ups`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFollowUps(data); })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    fetchProject();
    fetchStageData();
    fetchMeetings();
    fetchFollowUps();
  }, [fetchProject, fetchStageData, fetchMeetings, fetchFollowUps]);

  const saveStageData = async (stage: string, data: Record<string, unknown>, completed?: boolean) => {
    setSaving(stage);
    await fetch(`/api/projects/${params.id}/stage-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        data,
        completedAt: completed ? new Date().toISOString() : undefined,
      }),
    });
    fetchStageData();
    setSaving(null);
  };

  const advanceStage = async (nextStage: string) => {
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: nextStage }),
    });
    fetchProject();
    fetchStageData();
  };

  const archiveProject = async () => {
    await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    router.push("/projects");
  };

  const saveFollowUp = async (fu: { id?: string; attemptNumber: number; date: string; notes: string; responded: boolean }) => {
    await fetch(`/api/projects/${params.id}/follow-ups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fu),
    });
    fetchFollowUps();
  };

  const openMeetingScheduler = (stage: string, title: string) => {
    setMeetingStage(stage);
    setMeetingTitle(title);
    setShowMeetingModal(true);
  };

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  const currentStageIdx = STAGES.findIndex((s) => s.key === project.stage);
  const completedStages = STAGES.slice(0, currentStageIdx);
  const currentStage = STAGE_MAP[project.stage as StageKey];
  const nextStageKey = getNextStage(project.stage as StageKey);

  // Get stage-specific data helper
  const sd = (stage: string) => (stageDataMap[stage]?.data || {}) as Record<string, unknown>;
  const stageMeetings = (stage: string) => meetings.filter((m) => m.stage === stage);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/projects")} className="text-zinc-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-syne font-bold text-white">
            {project.contact.name} — {project.jobType}
          </h1>
          <p className="text-xs text-zinc-500 font-mono">{project.address}</p>
        </div>
        {currentStage && (
          <span className={`ml-auto text-xs font-mono px-3 py-1 rounded-full ${currentStage.color}/20 ${currentStage.textColor}`}>
            {currentStage.shortLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left — Phase Timeline */}
        <div className="space-y-4">
          {/* Current active stage */}
          {currentStage && (
            <StageCard
              stage={currentStage}
              active
              expanded
              project={project}
              data={sd(project.stage)}
              dataLoaded={stageDataLoaded}
              meetings={stageMeetings(project.stage)}
              followUps={followUps}
              saving={saving === project.stage}
              onSaveData={(d) => saveStageData(project.stage, d)}
              onAdvance={nextStageKey ? () => advanceStage(nextStageKey) : undefined}
              onArchive={archiveProject}
              onScheduleMeeting={(title) => openMeetingScheduler(project.stage, title)}
              onSaveFollowUp={saveFollowUp}
            />
          )}

          {/* Completed stages — reverse order (most recent first) */}
          {[...completedStages].reverse().map((s) => {
            const isExpanded = expandedStages.has(s.key);
            return (
              <StageCard
                key={s.key}
                stage={s}
                active={false}
                expanded={isExpanded}
                project={project}
                data={sd(s.key)}
                dataLoaded={stageDataLoaded}
                meetings={stageMeetings(s.key)}
                followUps={s.key === "S4" ? followUps : []}
                saving={saving === s.key}
                onSaveData={(d) => saveStageData(s.key, d)}
                onToggle={() => toggleStage(s.key)}
                onScheduleMeeting={(title) => openMeetingScheduler(s.key, title)}
                onSaveFollowUp={saveFollowUp}
              />
            );
          })}
        </div>

        {/* Right — Project + Client Info */}
        <div className="space-y-4">
          <Card title="Project Info">
            <div className="space-y-3 text-sm">
              <InfoRow label="Type" value={project.jobType} />
              <InfoRow label="Address" value={project.address} />
              <InfoRow label="Value" value={project.value ? `$${project.value.toLocaleString()}` : "—"} />
              <InfoRow label="Scope" value={project.scope || "—"} />
              <InfoRow label="Created" value={new Date(project.createdAt).toLocaleDateString()} />
              {project.driveFolderUrl && (
                <a
                  href={project.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono"
                >
                  Google Drive Folder
                </a>
              )}
            </div>
          </Card>
          <Card title="Client">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-zinc-200">{project.contact.name}</p>
              {project.contact.phone && (
                <a href={`tel:${project.contact.phone}`} className="text-zinc-400 hover:text-white block text-xs font-mono">
                  {project.contact.phone}
                </a>
              )}
              {project.contact.email && (
                <a href={`mailto:${project.contact.email}`} className="text-zinc-400 hover:text-white block text-xs font-mono">
                  {project.contact.email}
                </a>
              )}
            </div>
          </Card>
          {project.assignedUser && (
            <Card title="Assigned To">
              <p className="text-sm text-zinc-200">{project.assignedUser.name}</p>
            </Card>
          )}
        </div>
      </div>

      <MeetingScheduler
        open={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        projectId={project.id}
        stage={meetingStage}
        defaultTitle={meetingTitle}
        clientEmail={project.contact.email}
        onCreated={fetchMeetings}
      />
    </div>
  );
}

// ─── Stage Card ─────────────────────────────────────────────
interface StageCardProps {
  stage: { key: string; label: string; shortLabel: string; color: string; textColor: string };
  active: boolean;
  expanded: boolean;
  project: Project;
  data: Record<string, unknown>;
  dataLoaded: boolean;
  meetings: MeetingRecord[];
  followUps: FollowUpRecord[];
  saving: boolean;
  onSaveData: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
  onArchive?: () => void;
  onToggle?: () => void;
  onScheduleMeeting: (title: string) => void;
  onSaveFollowUp: (fu: { id?: string; attemptNumber: number; date: string; notes: string; responded: boolean }) => void;
}

function StageCard({
  stage,
  active,
  expanded,
  project,
  data,
  dataLoaded,
  meetings,
  followUps,
  saving,
  onSaveData,
  onAdvance,
  onArchive,
  onToggle,
  onScheduleMeeting,
  onSaveFollowUp,
}: StageCardProps) {
  return (
    <div className={`rounded-xl border ${active ? "border-[#c47a4f]/50 bg-zinc-800/50" : "border-zinc-800 bg-zinc-900/50"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
        disabled={active}
      >
        {!active && (
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {active && <span className={`w-2.5 h-2.5 rounded-full ${stage.color} shrink-0`} />}
        <span className={`text-sm font-semibold ${active ? "text-[#c47a4f]" : "text-zinc-400"}`}>
          {stage.shortLabel}
        </span>
        <span className="text-xs text-zinc-600 font-mono">{stage.label}</span>
        {!active && (
          <svg className={`w-4 h-4 text-zinc-600 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {!dataLoaded ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-8 bg-zinc-800 rounded-lg w-1/3" />
              <div className="h-10 bg-zinc-800 rounded-lg" />
              <div className="h-10 bg-zinc-800 rounded-lg w-2/3" />
            </div>
          ) : (
            <>
              {stage.key === "S1" && (
                <NewLeadStageCard data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} />
              )}
              {stage.key === "S2" && (
                <SiteWalkStageCard data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} meetings={meetings} onScheduleMeeting={() => onScheduleMeeting("Site Walk - " + project.contact.name)} />
              )}
              {stage.key === "S3" && (
                <EstimateStageCard data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} />
              )}
              {stage.key === "S4" && (
                <FollowUpStageCard followUps={followUps} data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} onArchive={onArchive} onSaveFollowUp={onSaveFollowUp} />
              )}
              {stage.key === "S5" && (
                <ProjectHandoffStageCard data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} meetings={meetings} onScheduleMeeting={() => onScheduleMeeting("Project Handoff - " + project.contact.name)} />
              )}
              {stage.key.startsWith("O") && (
                <GenericStageCard data={data} saving={saving} onSave={onSaveData} onAdvance={onAdvance} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── S1: New Lead ───────────────────────────────────────────
function NewLeadStageCard({
  data,
  saving,
  onSave,
  onAdvance,
}: {
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
}) {
  const [source, setSource] = useState((data.source as string) || "");
  const [followUpDate, setFollowUpDate] = useState((data.followUpDate as string) || "");
  const [followUpNotes, setFollowUpNotes] = useState((data.followUpNotes as string) || "");
  const [followUpDone, setFollowUpDone] = useState((data.followUpDone as boolean) || false);

  useEffect(() => {
    setSource((data.source as string) || "");
    setFollowUpDate((data.followUpDate as string) || "");
    setFollowUpNotes((data.followUpNotes as string) || "");
    setFollowUpDone((data.followUpDone as boolean) || false);
  }, [data]);

  return (
    <>
      <div>
        <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Client Source</label>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]">
          <option value="">Select...</option>
          <option value="google">Google</option>
          <option value="referral">Referral</option>
          <option value="door_knock">Door Knock</option>
          <option value="social">Social Media</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="border-t border-zinc-800 pt-3">
        <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider mb-2">Follow Up Call</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-zinc-500 block mb-1">Date</label>
            <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" checked={followUpDone} onChange={(e) => setFollowUpDone(e.target.checked)} className="accent-[#c47a4f]" />
              Completed
            </label>
          </div>
        </div>
        <div className="mt-2">
          <label className="text-xs font-mono text-zinc-500 block mb-1">Notes</label>
          <textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ source, followUpDate, followUpNotes, followUpDone })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onAdvance && (
          <button onClick={onAdvance} disabled={!followUpDone} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-30" title={!followUpDone ? "Complete follow up call first" : ""}>
            Advance to Site Walk
          </button>
        )}
      </div>
    </>
  );
}

// ─── S2: Site Walk ──────────────────────────────────────────
function SiteWalkStageCard({
  data,
  saving,
  onSave,
  onAdvance,
  meetings,
  onScheduleMeeting,
}: {
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
  meetings: MeetingRecord[];
  onScheduleMeeting: () => void;
}) {
  const [notes, setNotes] = useState((data.notes as string) || "");

  useEffect(() => {
    setNotes((data.notes as string) || "");
  }, [data]);

  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={onScheduleMeeting} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule Site Walk
        </button>
      </div>
      {meetings.length > 0 && (
        <div className="space-y-1">
          {meetings.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {m.title} — {new Date(m.scheduledAt).toLocaleString()}
              {m.googleEventUrl && (
                <a href={m.googleEventUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Calendar</a>
              )}
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="text-xs font-mono text-zinc-500 block mb-1">Site Walk Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ notes })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onAdvance && (
          <button onClick={onAdvance} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Advance to Estimate
          </button>
        )}
      </div>
    </>
  );
}

// ─── S3: Estimate ───────────────────────────────────────────
function EstimateStageCard({
  data,
  saving,
  onSave,
  onAdvance,
}: {
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
}) {
  const [amount, setAmount] = useState((data.amount as string) || "");
  const [dateSent, setDateSent] = useState((data.dateSent as string) || "");
  const [notes, setNotes] = useState((data.notes as string) || "");

  useEffect(() => {
    setAmount((data.amount as string) || "");
    setDateSent((data.dateSent as string) || "");
    setNotes((data.notes as string) || "");
  }, [data]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-mono text-zinc-500 block mb-1">Estimate Amount</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="25000" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
        </div>
        <div>
          <label className="text-xs font-mono text-zinc-500 block mb-1">Date Sent to Client</label>
          <input type="date" value={dateSent} onChange={(e) => setDateSent(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
        </div>
      </div>
      <div>
        <label className="text-xs font-mono text-zinc-500 block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ amount, dateSent, notes })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onAdvance && (
          <button onClick={onAdvance} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Advance to Follow Up
          </button>
        )}
      </div>
    </>
  );
}

// ─── S4: Follow Up ──────────────────────────────────────────
function FollowUpStageCard({
  followUps,
  data,
  saving,
  onSave,
  onAdvance,
  onArchive,
  onSaveFollowUp,
}: {
  followUps: FollowUpRecord[];
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
  onArchive?: () => void;
  onSaveFollowUp: (fu: { id?: string; attemptNumber: number; date: string; notes: string; responded: boolean }) => void;
}) {
  const [attempts, setAttempts] = useState<{ id?: string; attemptNumber: number; date: string; notes: string; responded: boolean }[]>(() => {
    if (followUps.length > 0) {
      return followUps.map((f) => ({
        id: f.id,
        attemptNumber: f.attemptNumber,
        date: f.date ? f.date.slice(0, 10) : "",
        notes: f.notes || "",
        responded: f.responded,
      }));
    }
    return [{ attemptNumber: 1, date: "", notes: "", responded: false }];
  });
  const [closeNote, setCloseNote] = useState((data.closeNote as string) || "");

  useEffect(() => {
    if (followUps.length > 0) {
      setAttempts(
        followUps.map((f) => ({
          id: f.id,
          attemptNumber: f.attemptNumber,
          date: f.date ? f.date.slice(0, 10) : "",
          notes: f.notes || "",
          responded: f.responded,
        }))
      );
    }
  }, [followUps]);

  useEffect(() => {
    setCloseNote((data.closeNote as string) || "");
  }, [data]);

  const addAttempt = () => {
    if (attempts.length < 3) {
      setAttempts([...attempts, { attemptNumber: attempts.length + 1, date: "", notes: "", responded: false }]);
    }
  };

  const updateAttempt = (idx: number, field: string, value: unknown) => {
    const next = [...attempts];
    (next[idx] as Record<string, unknown>)[field] = value;
    setAttempts(next);
  };

  return (
    <>
      {attempts.map((a, i) => (
        <div key={i} className="border border-zinc-800 rounded-lg p-3 space-y-2">
          <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">Attempt #{a.attemptNumber}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-zinc-500 block mb-1">Date</label>
              <input type="date" value={a.date} onChange={(e) => updateAttempt(i, "date", e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={a.responded} onChange={(e) => updateAttempt(i, "responded", e.target.checked)} className="accent-[#c47a4f]" />
                Responded
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 block mb-1">Notes</label>
            <textarea value={a.notes} onChange={(e) => updateAttempt(i, "notes", e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
          </div>
          <button onClick={() => onSaveFollowUp(a)} className="text-xs text-[#c47a4f] hover:text-[#d89a6f] font-mono">
            Save Attempt
          </button>
        </div>
      ))}
      {attempts.length < 3 && (
        <button onClick={addAttempt} className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors">
          + Add Follow Up Attempt
        </button>
      )}
      <div>
        <label className="text-xs font-mono text-zinc-500 block mb-1">Close Out Note (if no response)</label>
        <textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ closeNote })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onArchive && (
          <button onClick={onArchive} className="border border-red-800 text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-lg transition-colors">
            Archive Project
          </button>
        )}
        {onAdvance && (
          <button onClick={onAdvance} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Advance to Project Handoff
          </button>
        )}
      </div>
    </>
  );
}

// ─── S5: Project Handoff ────────────────────────────────────
function ProjectHandoffStageCard({
  data,
  saving,
  onSave,
  onAdvance,
  meetings,
  onScheduleMeeting,
}: {
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
  meetings: MeetingRecord[];
  onScheduleMeeting: () => void;
}) {
  const [contractSigned, setContractSigned] = useState((data.contractSigned as boolean) || false);
  const [depositReceived, setDepositReceived] = useState((data.depositReceived as boolean) || false);
  const [depositAmount, setDepositAmount] = useState((data.depositAmount as string) || "");
  const [notes, setNotes] = useState((data.notes as string) || "");

  useEffect(() => {
    setContractSigned((data.contractSigned as boolean) || false);
    setDepositReceived((data.depositReceived as boolean) || false);
    setDepositAmount((data.depositAmount as string) || "");
    setNotes((data.notes as string) || "");
  }, [data]);

  return (
    <>
      <div className="flex items-center gap-3">
        <button onClick={onScheduleMeeting} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule Meeting
        </button>
      </div>
      {meetings.length > 0 && (
        <div className="space-y-1">
          {meetings.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {m.title} — {new Date(m.scheduledAt).toLocaleString()}
              {m.googleEventUrl && (
                <a href={m.googleEventUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Calendar</a>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={contractSigned} onChange={(e) => setContractSigned(e.target.checked)} className="accent-[#c47a4f]" />
          Signed Contract on File
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={depositReceived} onChange={(e) => setDepositReceived(e.target.checked)} className="accent-[#c47a4f]" />
            Deposit Received
          </label>
          {depositReceived && (
            <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Amount" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 w-32 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
          )}
        </div>
      </div>
      <div>
        <label className="text-xs font-mono text-zinc-500 block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ contractSigned, depositReceived, depositAmount, notes })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onAdvance && (
          <button onClick={onAdvance} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Advance to Pre-Construction
          </button>
        )}
      </div>
    </>
  );
}

// ─── Generic Ops Stage Card ─────────────────────────────────
function GenericStageCard({
  data,
  saving,
  onSave,
  onAdvance,
}: {
  data: Record<string, unknown>;
  saving: boolean;
  onSave: (d: Record<string, unknown>) => void;
  onAdvance?: () => void;
}) {
  const [notes, setNotes] = useState((data.notes as string) || "");

  useEffect(() => {
    setNotes((data.notes as string) || "");
  }, [data]);

  return (
    <>
      <div>
        <label className="text-xs font-mono text-zinc-500 block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y" />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onSave({ notes })} disabled={saving} className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        {onAdvance && (
          <button onClick={onAdvance} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Advance Stage
          </button>
        )}
      </div>
    </>
  );
}

// ─── Shared Components ──────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-4">
      <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500 text-xs font-mono">{label}</span>
      <span className="text-zinc-300 text-sm">{value}</span>
    </div>
  );
}
