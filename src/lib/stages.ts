// ─── 10-Stage Workflow Definition ─────────────────────────────
// S1-S5 = Sales Pipeline, O1-O5 = Operations Pipeline

export type StageKey =
  | "S1" | "S2" | "S3" | "S4" | "S5"
  | "O1" | "O2" | "O3" | "O4" | "O5";

export type Division = "SALES" | "OPS";

export interface StageDefinition {
  key: StageKey;
  label: string;
  shortLabel: string;
  division: Division;
  color: string;       // tailwind bg class
  textColor: string;   // tailwind text class
  exitChecklist: string[];
}

export const STAGES: StageDefinition[] = [
  // ── SALES ──────────────────────────────────────────────
  {
    key: "S1",
    label: "New Lead / First Contact",
    shortLabel: "New Lead",
    division: "SALES",
    color: "bg-blue-500",
    textColor: "text-blue-400",
    exitChecklist: [
      "Lead logged in CRM with contact info and project type",
      "Lead source recorded",
      "Initial contact made within 1 hour",
      "Lead qualified — scope, location, and budget are realistic",
      "Site walk scheduled",
    ],
  },
  {
    key: "S2",
    label: "Site Walk & Discovery",
    shortLabel: "Site Walk",
    division: "SALES",
    color: "bg-indigo-500",
    textColor: "text-indigo-400",
    exitChecklist: [
      "Site walk completed and notes logged in project",
      "Photos taken and attached to project",
      "Scope of work documented",
      "Client selections noted (where applicable)",
      "Rough budget discussed with client",
      "Any scope risks or unknowns documented",
    ],
  },
  {
    key: "S3",
    label: "Estimate & Quote",
    shortLabel: "Estimate",
    division: "SALES",
    color: "bg-violet-500",
    textColor: "text-violet-400",
    exitChecklist: [
      "Estimate built with full scope coverage",
      "20% markup applied",
      "Client-facing quote generated and sent",
      "Expiration date set on quote",
      "Client has received quote and confirmed receipt",
    ],
  },
  {
    key: "S4",
    label: "Follow Up & Negotiation",
    shortLabel: "Follow Up",
    division: "SALES",
    color: "bg-amber-500",
    textColor: "text-amber-400",
    exitChecklist: [
      "All follow-up attempts documented",
      "Client objections addressed",
      "Final quote version agreed upon",
      "Client verbally or in writing agrees to move forward",
    ],
  },
  {
    key: "S5",
    label: "Contract & Deposit",
    shortLabel: "Project Handoff",
    division: "SALES",
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    exitChecklist: [
      "Signed estimate on file",
      "Signed contract on file",
      "Deposit collected and confirmed",
      "Site walk notes logged in project",
      "Project start date confirmed",
    ],
  },

  // ── OPERATIONS ─────────────────────────────────────────
  {
    key: "O1",
    label: "Pre-Construction Setup",
    shortLabel: "Pre-Con",
    division: "OPS",
    color: "bg-cyan-500",
    textColor: "text-cyan-400",
    exitChecklist: [
      "Project schedule created with milestones",
      "Crew and lead tech assigned",
      "Phase 1 POs issued",
      "Permits confirmed (pulled or not required)",
      "Client pre-construction communication sent",
    ],
  },
  {
    key: "O2",
    label: "Active Construction",
    shortLabel: "In Production",
    division: "OPS",
    color: "bg-orange-500",
    textColor: "text-orange-400",
    exitChecklist: [
      "All tasks marked complete",
      "All POs received and reconciled",
      "All change orders signed and invoiced",
      "Final walkthrough with client scheduled",
      "Punch list created from final walkthrough",
    ],
  },
  {
    key: "O3",
    label: "Punch List & Final Walkthrough",
    shortLabel: "Punch / QC",
    division: "OPS",
    color: "bg-rose-500",
    textColor: "text-rose-400",
    exitChecklist: [
      "Final walkthrough completed with client",
      "Punch list documented in project",
      "All punch list items completed",
      "Client sign-off obtained",
    ],
  },
  {
    key: "O4",
    label: "Final Invoice & Payment",
    shortLabel: "Invoice",
    division: "OPS",
    color: "bg-teal-500",
    textColor: "text-teal-400",
    exitChecklist: [
      "Final invoice generated and sent",
      "All approved change orders included in final invoice",
      "Final payment collected",
      "Payment receipt issued",
    ],
  },
  {
    key: "O5",
    label: "Project Close & Follow Up",
    shortLabel: "Closed",
    division: "OPS",
    color: "bg-green-500",
    textColor: "text-green-400",
    exitChecklist: [
      "Project marked as Complete in the system",
      "All documents archived",
      "Client thank-you message sent",
      "Google review requested",
      "Referral requested",
      "Final job cost vs contract value reviewed",
    ],
  },
];

export const STAGE_MAP = Object.fromEntries(
  STAGES.map((s) => [s.key, s])
) as Record<StageKey, StageDefinition>;

export const SALES_STAGES = STAGES.filter((s) => s.division === "SALES");
export const OPS_STAGES = STAGES.filter((s) => s.division === "OPS");

/** Get the next stage key, or null if at the end */
export function getNextStage(current: StageKey): StageKey | null {
  const idx = STAGES.findIndex((s) => s.key === current);
  if (idx === -1 || idx === STAGES.length - 1) return null;
  return STAGES[idx + 1].key;
}

/** Get the previous stage key, or null if at the start */
export function getPrevStage(current: StageKey): StageKey | null {
  const idx = STAGES.findIndex((s) => s.key === current);
  if (idx <= 0) return null;
  return STAGES[idx - 1].key;
}
