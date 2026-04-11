"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftRight,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Target,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddLeadModal from "@/components/AddLeadModal";
import FollowUpModal from "@/components/FollowUpModal";
import { useCRM } from "@/context/CRMContext";
import { useKanbanScroll } from "@/hooks/useKanbanScroll";
import { formatDealValueCurrency } from "@/lib/dealValue";
import { formatMetaPriorityAge, getMetaPrioritySlaState, META_PRIORITY_STATUS } from "@/lib/metaPriority";

const COLUMNS = [
  {
    id: META_PRIORITY_STATUS,
    title: "Meta Priority",
    subtitle: "Fresh Meta leads waiting for first setter touch",
    accent: "bg-orange-400",
    border: "border-orange-400/20",
  },
  {
    id: "new",
    title: "Market Targets",
    subtitle: "Fresh leads ready for first touch",
    accent: "bg-primary",
    border: "border-primary/20",
  },
  {
    id: "called",
    title: "Active Pipeline",
    subtitle: "Working conversations and follow-up",
    accent: "bg-amber-400",
    border: "border-amber-400/20",
  },
  {
    id: "booked",
    title: "Elite Bookings",
    subtitle: "Booked demos and confirmed handoffs",
    accent: "bg-emerald-400",
    border: "border-emerald-400/20",
  },
  {
    id: "ignored",
    title: "Archived Ops",
    subtitle: "Low-priority or closed-out targets",
    accent: "bg-rose-400",
    border: "border-rose-400/20",
  },
] as const;

const CALLED_DISPOSITIONS = ["hot", "cold", "followup"] as const;
const STAGE_FILTERS = [{ id: "all", label: "All Stages" }, ...COLUMNS.map((column) => ({ id: column.id, label: column.title }))] as const;
const CALLED_FILTERS = [{ id: "all", label: "All Called" }, ...CALLED_DISPOSITIONS.map((value) => ({ id: value, label: value }))] as const;
const DISPOSITION_PRIORITY: Record<(typeof CALLED_DISPOSITIONS)[number], number> = {
  hot: 0,
  followup: 1,
  cold: 2,
};
const DISPOSITION_STYLES: Record<(typeof CALLED_DISPOSITIONS)[number], string> = {
  hot: "border-emerald-400/40 bg-emerald-400/15 text-emerald-100",
  cold: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  followup: "border-amber-400/40 bg-amber-400/15 text-amber-100",
};
const STAGE_LABELS: Record<(typeof COLUMNS)[number]["id"], string> = {
  [META_PRIORITY_STATUS]: "Meta Priority",
  new: "New",
  called: "Called",
  booked: "Booked",
  ignored: "Ignored",
};
const STAGE_BADGE_STYLES: Record<(typeof COLUMNS)[number]["id"], string> = {
  [META_PRIORITY_STATUS]: "border-orange-400/30 bg-orange-400/12 text-orange-100",
  new: "border-primary/30 bg-primary/10 text-primary",
  called: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  booked: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  ignored: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};
const PRIORITY_SLA_STYLES = {
  fresh: "border-emerald-400/30 bg-emerald-400/12 text-emerald-100",
  overdue: "border-amber-400/30 bg-amber-400/12 text-amber-100",
  escalated: "border-rose-400/30 bg-rose-400/12 text-rose-100",
} as const;
const WORKFLOW_STAGE_OPTIONS = COLUMNS.filter((column) => column.id !== META_PRIORITY_STATUS);

type ColumnId = (typeof COLUMNS)[number]["id"];
type CalledDisposition = (typeof CALLED_DISPOSITIONS)[number];
type StageFilter = "all" | ColumnId;
type CalledFilter = "all" | CalledDisposition;

type LeadInteraction = {
  id: string;
  lead_id: string;
  kind: "call" | "sms" | "email";
  disposition: CalledDisposition | null;
  note: string | null;
  meta: Record<string, any>;
  occurred_at: string;
};

const toFollowUpLead = (lead: any) => ({
  Email: lead.Email || "",
  "First Name": lead["First Name"] || "Doctor",
  "Practice Name": lead["Practice Name"] || "Clinic",
  Phone: lead.Phone || "",
  City: lead.City || "",
});

const formatExactTime = (value?: string | null) => {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getPrioritySlaLabel = (value?: string | null) => {
  const state = getMetaPrioritySlaState(value);
  if (state === "escalated") return "Escalated";
  if (state === "overdue") return "Overdue";
  return "Fresh";
};

const parseScheduledTimestamp = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;

  const structuredMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s*@\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (structuredMatch) {
    const [, datePart, rawHours, rawMinutes, rawMeridiem] = structuredMatch;
    let hours = Number(rawHours);
    const minutes = Number(rawMinutes);
    const meridiem = rawMeridiem.toUpperCase();

    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes).getTime();
  }

  const fallback = new Date(value).getTime();
  return Number.isNaN(fallback) ? Number.POSITIVE_INFINITY : fallback;
};

const getInteractionLabel = (interaction: LeadInteraction) => {
  if (interaction.kind === "call") return "Call logged";
  if (interaction.kind === "sms") return "SMS opened";
  return "Email opened";
};

const getSearchText = (lead: any) => {
  return [
    lead["Practice Name"],
    lead["First Name"],
    lead["Last Name"],
    lead.City,
    lead.State,
    lead.Phone,
    lead.Email,
    lead.Source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getStatusForLead = (leadNotes: Record<string, any>, leadId: string): ColumnId => {
  const status = leadNotes[leadId]?.status || "new";
  return COLUMNS.some((column) => column.id === status) ? (status as ColumnId) : "new";
};

export default function DealsPage() {
  const {
    leads,
    leadNotes,
    interactions,
    updateLeadNote,
    startOutboundCall,
    logOutboundMessage,
    metaPrioritySummary,
  } = useCRM();
  const { boardRef, handleBoardWheel, handleRailWheel } = useKanbanScroll();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [followUpTab, setFollowUpTab] = useState<"email" | "sms">("sms");
  const [stageSelectorId, setStageSelectorId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [panelNote, setPanelNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [calledFilter, setCalledFilter] = useState<CalledFilter>("all");
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const previousExpandedLeadIdRef = useRef<string | null>(null);

  const expandedLead = useMemo(
    () => leads.find((lead) => lead.id === expandedLeadId) || null,
    [leads, expandedLeadId],
  );

  const interactionSummaryByLead = useMemo(() => {
    const summary = new Map<
      string,
      {
        callCount: number;
        messageCount: number;
        lastInteraction: LeadInteraction | null;
        lastCall: LeadInteraction | null;
        lastMessage: LeadInteraction | null;
        recent: LeadInteraction[];
      }
    >();

    (interactions as LeadInteraction[]).forEach((entry) => {
      if (!summary.has(entry.lead_id)) {
        summary.set(entry.lead_id, {
          callCount: 0,
          messageCount: 0,
          lastInteraction: null,
          lastCall: null,
          lastMessage: null,
          recent: [],
        });
      }

      const current = summary.get(entry.lead_id)!;
      current.lastInteraction = current.lastInteraction || entry;
      if (entry.kind === "call") {
        current.callCount += 1;
        current.lastCall = current.lastCall || entry;
      } else {
        current.messageCount += 1;
        current.lastMessage = current.lastMessage || entry;
      }
      if (current.recent.length < 5) {
        current.recent.push(entry);
      }
    });

    return summary;
  }, [interactions]);

  const persistPanelNote = useCallback(
    async (leadId?: string | null, nextNote?: string) => {
      if (!leadId) return;
      const savedNote = leadNotes[leadId]?.comment || "";
      const resolvedNote = nextNote ?? panelNote;
      if (resolvedNote === savedNote) return;
      await updateLeadNote(leadId, { comment: resolvedNote });
    },
    [leadNotes, panelNote, updateLeadNote],
  );

  const closeLeadPanel = useCallback(async () => {
    await persistPanelNote(expandedLeadId, panelNote);
    setExpandedLeadId(null);
    setStageSelectorId(null);
  }, [expandedLeadId, panelNote, persistPanelNote]);

  const openLeadPanel = useCallback(
    async (leadId: string) => {
      if (expandedLeadId && expandedLeadId !== leadId) {
        await persistPanelNote(expandedLeadId, panelNote);
      }
      setExpandedLeadId(leadId);
      setStageSelectorId(null);
    },
    [expandedLeadId, panelNote, persistPanelNote],
  );

  useEffect(() => {
    if (!expandedLeadId) {
      previousExpandedLeadIdRef.current = null;
      setPanelNote("");
      return;
    }

    if (previousExpandedLeadIdRef.current === expandedLeadId) {
      return;
    }

    previousExpandedLeadIdRef.current = expandedLeadId;
    setPanelNote(leadNotes[expandedLeadId]?.comment || "");
  }, [expandedLeadId, leadNotes]);

  useEffect(() => {
    if (expandedLeadId && !expandedLead) {
      setExpandedLeadId(null);
      setPanelNote("");
    }
  }, [expandedLeadId, expandedLead]);

  useEffect(() => {
    if (!expandedLeadId) return;
    const savedNote = leadNotes[expandedLeadId]?.comment || "";
    if (panelNote === savedNote) return;

    const timeout = window.setTimeout(() => {
      void updateLeadNote(expandedLeadId, { comment: panelNote });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [expandedLeadId, panelNote, leadNotes, updateLeadNote]);

  useEffect(() => {
    if (!expandedLeadId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      void closeLeadPanel();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expandedLeadId, closeLeadPanel]);

  const openFollowUp = useCallback(
    async (lead: any, tab: "email" | "sms", origin: string) => {
      await logOutboundMessage(lead, {
        kind: tab,
        disposition: leadNotes[lead.id]?.called_disposition || null,
        meta: { origin },
      });
      setSelectedLead(lead);
      setFollowUpTab(tab);
      setIsFollowUpOpen(true);
    },
    [leadNotes, logOutboundMessage],
  );

  const updateCalledDisposition = useCallback(
    async (lead: any, disposition: CalledDisposition | null) => {
      await updateLeadNote(lead.id, {
        status: disposition ? "called" : leadNotes[lead.id]?.status || "called",
        called_disposition: disposition,
        comment: lead.id === expandedLeadId ? panelNote : leadNotes[lead.id]?.comment || "",
      });
    },
    [expandedLeadId, leadNotes, panelNote, updateLeadNote],
  );

  const columnTotals = useMemo(() => {
    return leads.reduce<Record<ColumnId, number>>(
      (acc, lead) => {
        const status = getStatusForLead(leadNotes, lead.id);
        acc[status] += 1;
        return acc;
      },
      { [META_PRIORITY_STATUS]: 0, new: 0, called: 0, booked: 0, ignored: 0 },
    );
  }, [leads, leadNotes]);

  const visibleLeadsByStatus = useMemo(() => {
    const grouped: Record<ColumnId, any[]> = {
      [META_PRIORITY_STATUS]: [],
      new: [],
      called: [],
      booked: [],
      ignored: [],
    };
    const query = searchQuery.trim().toLowerCase();

    const getActivityTimestamp = (lead: any) => {
      const notes = leadNotes[lead.id] || {};
      const summary = interactionSummaryByLead.get(lead.id);
      const candidate = summary?.lastInteraction?.occurred_at || notes.synced_at || lead.UpdatedAt || lead.CreatedAt;
      const timestamp = candidate ? new Date(candidate).getTime() : 0;
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const compareLeads = (status: ColumnId, left: any, right: any) => {
      const leftNotes = leadNotes[left.id] || {};
      const rightNotes = leadNotes[right.id] || {};

      if (status === META_PRIORITY_STATUS) {
        const leftCreated = new Date(left.MetaPriorityCreatedAt || left.CreatedAt || 0).getTime();
        const rightCreated = new Date(right.MetaPriorityCreatedAt || right.CreatedAt || 0).getTime();
        return leftCreated - rightCreated;
      }

      if (status === "called") {
        const leftPriority = DISPOSITION_PRIORITY[leftNotes.called_disposition as CalledDisposition] ?? 3;
        const rightPriority = DISPOSITION_PRIORITY[rightNotes.called_disposition as CalledDisposition] ?? 3;
        if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      }

      if (status === "booked") {
        const leftScheduled = parseScheduledTimestamp(leftNotes.scheduled_time);
        const rightScheduled = parseScheduledTimestamp(rightNotes.scheduled_time);
        if (leftScheduled !== rightScheduled) return leftScheduled - rightScheduled;
      }

      const activityDelta = getActivityTimestamp(right) - getActivityTimestamp(left);
      if (activityDelta !== 0) return activityDelta;

      return (right["Practice Name"] || "").localeCompare(left["Practice Name"] || "");
    };

    leads.forEach((lead) => {
      const status = getStatusForLead(leadNotes, lead.id);
      const disposition = (leadNotes[lead.id]?.called_disposition || null) as CalledDisposition | null;

      if (stageFilter !== "all" && status !== stageFilter) {
        return;
      }

      if (status === "called" && stageFilter === "called" && calledFilter !== "all" && disposition !== calledFilter) {
        return;
      }

      if (query && !getSearchText(lead).includes(query)) {
        return;
      }

      grouped[status].push(lead);
    });

    (Object.keys(grouped) as ColumnId[]).forEach((status) => {
      grouped[status].sort((left, right) => compareLeads(status, left, right));
    });

    return grouped;
  }, [calledFilter, interactionSummaryByLead, leadNotes, leads, searchQuery, stageFilter]);

  const columnsToRender = useMemo(() => {
    return stageFilter === "all" ? COLUMNS : COLUMNS.filter((column) => column.id === stageFilter);
  }, [stageFilter]);

  const totalVisibleResults = useMemo(() => {
    let total = 0;
    for (const column of columnsToRender) {
      total += visibleLeadsByStatus[column.id].length;
    }
    return total;
  }, [columnsToRender, visibleLeadsByStatus]);

  const panelSummary = expandedLead ? interactionSummaryByLead.get(expandedLead.id) : null;
  const panelLeadNotes = expandedLead ? leadNotes[expandedLead.id] || {} : null;
  const panelStatus = expandedLead ? getStatusForLead(leadNotes, expandedLead.id) : null;
  const panelDisposition = (panelLeadNotes?.called_disposition || null) as CalledDisposition | null;

  const renderLeadPanelContent = expandedLead ? (
    <div className="relative flex h-full flex-col overflow-y-auto rounded-[2rem] border border-white/10 bg-[#090909]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl custom-scrollbar">
      <div className="flex flex-col gap-5 p-5 pb-8 min-h-max">
        <div className="pointer-events-none font-sans absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%),rgba(255,255,255,0.03)] p-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${STAGE_BADGE_STYLES[panelStatus || "new"]}`}>
                {STAGE_LABELS[panelStatus || "new"]}
              </span>
              {panelDisposition && (
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${DISPOSITION_STYLES[panelDisposition]}`}>
                  {panelDisposition}
                </span>
              )}
              {panelStatus === META_PRIORITY_STATUS && (
                <>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                      PRIORITY_SLA_STYLES[getMetaPrioritySlaState(expandedLead.MetaPriorityCreatedAt || expandedLead.CreatedAt)]
                    }`}
                  >
                    {getPrioritySlaLabel(expandedLead.MetaPriorityCreatedAt || expandedLead.CreatedAt)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/60">
                    {formatMetaPriorityAge(expandedLead.MetaPriorityCreatedAt || expandedLead.CreatedAt)}
                  </span>
                </>
              )}
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/55">
                Source {expandedLead.Source || "manual"}
              </span>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.28em] text-primary/70">Lead Work Panel</p>
            <h3 className="mt-2 text-3xl font-heading font-black uppercase italic leading-tight text-white">
              {expandedLead["Practice Name"]}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
              <span className="flex items-center gap-2">
                <User size={12} /> {expandedLead["First Name"] || "Owner"}
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={12} /> {[expandedLead.City, expandedLead.State].filter(Boolean).join(", ") || "Location missing"}
              </span>
              {expandedLead["Google Maps URL"] && (
                <a
                  href={expandedLead["Google Maps URL"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  <ExternalLink size={12} /> Maps
                </a>
              )}
              <span className="flex items-center gap-2">
                <Phone size={12} /> {expandedLead.Phone || "No phone"}
              </span>
              <span className="flex items-center gap-2">
                <Mail size={12} /> {expandedLead.Email || "No email"}
              </span>
            </div>
          </div>

          <button
            onClick={() => void closeLeadPanel()}
            className="rounded-2xl border border-white/10 p-3 text-white/60 transition-colors hover:border-white/30 hover:text-white"
            aria-label="Close lead panel"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Last Call</p>
            <p className="mt-2 text-sm font-bold text-white">{formatExactTime(panelSummary?.lastCall?.occurred_at)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Calls Logged</p>
            <p className="mt-2 text-sm font-bold text-white">{panelSummary?.callCount || 0} total attempts</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40">Last Message</p>
            <p className="mt-2 text-sm font-bold text-white">{formatExactTime(panelSummary?.lastMessage?.occurred_at)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={async () => {
            await startOutboundCall(expandedLead, { meta: { origin: "deals_panel_call" } });
          }}
          className="rounded-2xl bg-emerald-500 px-4 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-black shadow-[0_14px_32px_rgba(52,211,153,0.24)] transition-transform hover:-translate-y-0.5 hover:bg-emerald-400"
        >
          <span className="flex items-center justify-center gap-2">
            <Phone size={15} /> Call Now
          </span>
        </button>
        <button
          onClick={() => void openFollowUp(expandedLead, "sms", "deals_panel_sms")}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
        >
          <span className="flex items-center justify-center gap-2">
            <MessageSquare size={15} /> SMS First
          </span>
        </button>
        <button
          onClick={() => void openFollowUp(expandedLead, "email", "deals_panel_email")}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:border-white/30 hover:bg-white/[0.08]"
        >
          <span className="flex items-center justify-center gap-2">
            <Mail size={15} /> Email
          </span>
        </button>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Pipeline Stage</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {WORKFLOW_STAGE_OPTIONS.map((column) => {
            const active = panelStatus === column.id;
            return (
              <button
                key={column.id}
                onClick={() =>
                  updateLeadNote(expandedLead.id, {
                    status: column.id,
                    comment: panelNote,
                  })
                }
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  active
                    ? "border-white/30 bg-white text-black"
                    : "border-white/10 bg-black/20 text-white/65 hover:border-white/25 hover:text-white"
                }`}
              >
                <span className="block text-[10px] font-black uppercase tracking-[0.22em]">{column.title}</span>
                <span className={`mt-1 block text-[11px] font-medium ${active ? "text-black/60" : "text-white/35"}`}>{column.subtitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Called Disposition</p>
          <button
            onClick={() => void updateCalledDisposition(expandedLead, null)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
          >
            Clear
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {CALLED_DISPOSITIONS.map((disposition) => {
            const active = panelDisposition === disposition;
            return (
              <button
                key={disposition}
                onClick={() => void updateCalledDisposition(expandedLead, disposition)}
                className={`rounded-2xl border px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                  active
                    ? DISPOSITION_STYLES[disposition]
                    : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                {disposition}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Lead Notes</p>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Autosaves while you work</span>
        </div>
        {expandedLead?.ImportedIntakeSummary && (
          <div className="mt-4 rounded-[1rem] border border-white/10 bg-black/25 p-4 max-h-48 overflow-y-auto custom-scrollbar">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block mb-2">Intake Summary</span>
            <pre className="text-[10px] font-mono text-white/50 whitespace-pre-wrap leading-relaxed">{expandedLead.ImportedIntakeSummary}</pre>
          </div>
        )}
        <textarea
          value={panelNote}
          onChange={(event) => setPanelNote(event.target.value)}
          onBlur={() => void persistPanelNote(expandedLead.id, panelNote)}
          className="mt-4 h-44 w-full resize-none rounded-[1.5rem] border border-white/10 bg-black/25 p-4 text-sm font-medium text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/30"
          placeholder="Log the objection, the hook that landed, and the next step."
        />
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Recent Activity</p>
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Exact interaction timestamps</span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {panelSummary?.recent.length ? (
            panelSummary.recent.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                      {getInteractionLabel(entry)}
                    </span>
                    {entry.disposition && (
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${DISPOSITION_STYLES[entry.disposition]}`}>
                        {entry.disposition}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    {formatExactTime(entry.occurred_at)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium leading-relaxed text-white/75">
                  {entry.note || "No note saved for this interaction. The open event was still logged for traceability."}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm font-medium text-white/45">
              No calls or messages logged for this lead yet.
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-transparent">
      <header onWheel={handleRailWheel} className="shrink-0 px-6 pb-4 pt-8 md:px-10 md:pt-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-2">
              <motion.h1
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-heading font-black uppercase leading-none tracking-tighter md:text-6xl"
              >
                Visual <span className="text-gradient">Pipeline.</span>
              </motion.h1>
              <p className="ml-1 text-[10px] font-black uppercase tracking-[0.44em] text-muted-foreground opacity-40">
                Faster setter triage on one screen
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[1.35rem] border border-white bg-white px-4 py-3 text-black shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-black/45">Visible</p>
                <p className="mt-1 text-lg font-heading font-black uppercase italic leading-none">
                  {totalVisibleResults} <span className="text-black/45">Leads</span>
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
                <p className="text-[9px] font-black uppercase tracking-[0.26em] text-white/35">View</p>
                <p className="mt-1 text-sm font-black uppercase tracking-[0.18em]">
                  {columnsToRender.length} active {columnsToRender.length === 1 ? "column" : "columns"}
                </p>
              </div>
            </div>
          </div>

          <div
            onWheel={handleRailWheel}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),rgba(0,0,0,0.24)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl"
          >
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative w-full xl:max-w-xl">
                <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search practice, contact, city, state, phone, or source"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] py-4 pl-14 pr-5 text-sm font-bold tracking-wide text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/25"
                />
              </div>

              <button
                onClick={() => setIsAddLeadModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-[11px] font-black uppercase tracking-[0.22em] text-black transition-transform hover:-translate-y-0.5 hover:bg-white/90"
              >
                <Plus size={18} strokeWidth={3} /> Add Lead
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {STAGE_FILTERS.map((filter) => {
                  const active = stageFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setStageFilter(filter.id as StageFilter);
                        if (filter.id !== "called") {
                          setCalledFilter("all");
                        }
                      }}
                      className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                Scroll lanes directly. Use shift + wheel or the rail to move across columns
              </p>
            </div>

            {stageFilter === "called" && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Called filter</div>
                <div className="flex flex-wrap items-center gap-2">
                  {CALLED_FILTERS.map((filter) => {
                    const active = calledFilter === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setCalledFilter(filter.id as CalledFilter)}
                        className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                          active
                            ? "border-amber-300 bg-amber-300 text-black"
                            : "border-white/10 bg-white/[0.04] text-white/55 hover:border-amber-300/40 hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {metaPrioritySummary.totalCount > 0 && (
            <div
              className={`rounded-[1.75rem] border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.2)] ${
                metaPrioritySummary.escalatedCount > 0
                  ? "border-red-500/20 bg-red-500/10"
                  : metaPrioritySummary.overdueCount > 0
                    ? "border-amber-500/20 bg-amber-500/10"
                    : "border-emerald-500/20 bg-emerald-500/10"
              }`}
            >
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/45">Live Meta Queue Alert</span>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-white">
                    {metaPrioritySummary.totalCount} shared • {metaPrioritySummary.freshCount} fresh • {metaPrioritySummary.overdueCount} overdue • {metaPrioritySummary.escalatedCount} escalated
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                    Oldest untouched: {metaPrioritySummary.oldestWaitingLeadName || "Shared queue"} • {metaPrioritySummary.oldestWaitingAgeLabel || "Just in"}
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.08] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                  CRM live alerts active
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className={`flex-1 h-full min-h-0 px-6 pb-8 md:px-10 ${expandedLead ? "lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6" : ""}`}>
        <div className="relative h-full min-h-0" onClick={(event) => {
          if (event.target === event.currentTarget && expandedLead) {
            void closeLeadPanel();
          }
        }}>
          <div className="pointer-events-none absolute inset-y-2 left-0 z-10 hidden w-10 bg-gradient-to-r from-[#050505] to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-2 right-0 z-10 hidden w-10 bg-gradient-to-l from-[#050505] to-transparent lg:block" />
          <div
            ref={boardRef}
            onWheel={handleBoardWheel}
            className="flex h-full min-h-0 items-stretch gap-5 overflow-x-auto overflow-y-hidden pb-4 pt-2 custom-scrollbar [scrollbar-gutter:stable_both-edges]"
          >
            {columnsToRender.map((column, columnIndex) => {
              const visibleLeads = visibleLeadsByStatus[column.id];
              const totalInColumn = columnTotals[column.id];
              const isFilteredColumn = stageFilter !== "all" && stageFilter === column.id;

              return (
                <div
                  key={column.id}
                  className={`flex h-full min-h-0 min-w-[320px] max-w-[360px] flex-shrink-0 flex-col gap-4 xl:min-w-[340px] ${
                    columnsToRender.length === 1 ? "w-full max-w-none" : ""
                  }`}
                >
                  <div className={`rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.14)] backdrop-blur-md ${isFilteredColumn ? "border-white/20" : "border-white/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full shadow-[0_0_16px_currentColor] ${column.accent}`} />
                        <div className="min-w-0">
                          <h3 className="font-heading text-sm font-black uppercase italic tracking-[0.16em] text-white">{column.title}</h3>
                          <p className="mt-1 text-[11px] font-medium leading-relaxed text-white/40">{column.subtitle}</p>
                        </div>
                      </div>
                      <div className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${isFilteredColumn ? "border-white bg-white text-black" : `text-white/65 ${column.border}`}`}>
                        {visibleLeads.length}
                        {visibleLeads.length !== totalInColumn ? ` / ${totalInColumn}` : ""}
                      </div>
                    </div>
                  </div>

                  <div
                    data-kanban-lane-scroll="true"
                    className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain rounded-[2rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] custom-scrollbar ${column.border}`}
                  >
                    <div className="flex flex-col gap-4">
                      {visibleLeads.map((lead: any, index: number) => {
                        const notes = leadNotes[lead.id] || {};
                        const status = getStatusForLead(leadNotes, lead.id);
                        const disposition = notes.called_disposition as CalledDisposition | null;
                        const summary = interactionSummaryByLead.get(lead.id);
                        const priorityTimestamp = lead.MetaPriorityCreatedAt || lead.CreatedAt;
                        const prioritySlaState = getMetaPrioritySlaState(priorityTimestamp);
                        const lastTouch = summary?.lastInteraction?.occurred_at || notes.synced_at || lead.UpdatedAt || lead.CreatedAt;
                        const lastTouchLabel = summary?.lastInteraction
                          ? `${getInteractionLabel(summary.lastInteraction)} ${formatRelativeTime(summary.lastInteraction.occurred_at)}`
                          : formatRelativeTime(lastTouch);
                        const isSelected = expandedLeadId === lead.id;

                        return (
                          <motion.div
                            key={lead.id}
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.03 + columnIndex * 0.06, duration: 0.35 }}
                            onClick={() => void openLeadPanel(lead.id)}
                            className={`group relative cursor-pointer rounded-[1.75rem] border p-5 transition-all duration-300 ${
                              isSelected
                                ? "border-white/35 bg-white/[0.08] shadow-[0_28px_70px_rgba(0,0,0,0.38)] -translate-y-0.5"
                                : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] shadow-[0_14px_35px_rgba(0,0,0,0.18)] hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-0.5"
                            } ${expandedLeadId && !isSelected ? "opacity-75 hover:opacity-100" : "opacity-100"}`}
                          >
                            <div className={`pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
                            <div className={`absolute inset-y-5 right-0 w-1.5 rounded-l-full ${column.accent} ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`} />

                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${STAGE_BADGE_STYLES[status]}`}>
                                    {STAGE_LABELS[status]}
                                  </span>
                                  {disposition && (
                                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${DISPOSITION_STYLES[disposition]}`}>
                                      {disposition}
                                    </span>
                                  )}
                                  {status === META_PRIORITY_STATUS && (
                                    <>
                                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${PRIORITY_SLA_STYLES[prioritySlaState]}`}>
                                        {getPrioritySlaLabel(priorityTimestamp)}
                                      </span>
                                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                                        {formatMetaPriorityAge(priorityTimestamp)}
                                      </span>
                                    </>
                                  )}
                                  {isSelected && (
                                    <span className="rounded-full border border-white/15 bg-white/[0.09] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                                      Live panel
                                    </span>
                                  )}
                                </div>
                                <h4 className="mt-4 line-clamp-2 pr-6 font-heading text-xl font-black uppercase italic leading-tight tracking-tight text-white transition-colors group-hover:text-primary">
                                  {lead["Practice Name"]}
                                </h4>
                              </div>

                              <ChevronRight size={18} className={`mt-1 flex-shrink-0 transition-all ${isSelected ? "translate-x-1 text-white" : "text-white/30 group-hover:translate-x-1 group-hover:text-white/70"}`} />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                              <span className="flex items-center gap-2">
                                <MapPin size={11} /> {[lead.City, lead.State].filter(Boolean).join(", ") || "Location missing"}
                              </span>
                              {lead["Google Maps URL"] && (
                                <a
                                  href={lead["Google Maps URL"]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/55 transition-colors hover:border-white/25 hover:text-white"
                                >
                                  <ExternalLink size={10} /> Maps
                                </a>
                              )}
                              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/40">
                                {lead.Source || "manual"}
                              </span>
                            </div>

                            <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(255,255,255,0.03))] p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                                    <User size={11} /> {status === META_PRIORITY_STATUS ? "Priority Intake" : "Contact"}
                                  </p>
                                  {status === META_PRIORITY_STATUS ? (
                                    <>
                                      <p className="mt-2 text-sm font-bold text-white">{formatMetaPriorityAge(priorityTimestamp)}</p>
                                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/38">
                                        {getPrioritySlaLabel(priorityTimestamp)} queue visibility
                                      </p>
                                    </>
                                  ) : (
                                    <p className="mt-2 truncate text-sm font-bold text-white">
                                      {[lead["First Name"], lead["Last Name"]].filter(Boolean).join(" ") || "Owner"}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                                    {status === META_PRIORITY_STATUS ? "Arrived" : "Last touch"}
                                  </p>
                                  <p className="mt-2 text-sm font-bold text-white">
                                    {status === META_PRIORITY_STATUS ? formatExactTime(priorityTimestamp) : lastTouchLabel}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                                <span>{lead.Phone || "No phone"}</span>
                                <span className="rounded-full border border-white/10 px-3 py-1">
                                  {summary?.callCount || 0} calls
                                </span>
                                <span className="rounded-full border border-white/10 px-3 py-1">
                                  {formatDealValueCurrency(notes.deal_value ?? lead.DealValue)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <button
                                onClick={async (event) => {
                                  event.stopPropagation();
                                  await startOutboundCall(lead, { meta: { origin: "deals_card_call" } });
                                }}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-[0_12px_28px_rgba(52,211,153,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-emerald-400"
                                title="Call lead"
                              >
                                <Phone size={15} strokeWidth={3} />
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void openFollowUp(lead, "sms", "deals_card_sms");
                                }}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white transition-colors hover:border-white/25 hover:bg-white/[0.08]"
                                title="Open SMS follow-up"
                              >
                                <MessageSquare size={15} strokeWidth={2.8} />
                              </button>
                              <div className="relative ml-auto">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setStageSelectorId(stageSelectorId === lead.id ? null : lead.id);
                                  }}
                                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-[10px] font-black uppercase tracking-[0.22em] transition-all ${
                                    stageSelectorId === lead.id
                                      ? "border-white bg-white text-black"
                                      : "border-white/10 bg-white/[0.05] text-white/70 hover:border-white/25 hover:text-white"
                                  }`}
                                >
                                  <ArrowLeftRight size={14} strokeWidth={2.8} /> Stage
                                </button>

                                <AnimatePresence>
                                  {stageSelectorId === lead.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                      className="absolute right-0 top-[calc(100%+0.65rem)] z-30 min-w-[190px] rounded-[1.25rem] border border-white/10 bg-[#111111] p-2 shadow-2xl"
                                    >
                                      {WORKFLOW_STAGE_OPTIONS.filter((columnOption) => columnOption.id !== status).map((columnOption) => (
                                        <button
                                          key={columnOption.id}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            updateLeadNote(lead.id, {
                                              status: columnOption.id,
                                              comment: leadNotes[lead.id]?.comment || "",
                                            });
                                            setStageSelectorId(null);
                                          }}
                                          className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[10px] font-black uppercase tracking-[0.22em] text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
                                        >
                                          {columnOption.title}
                                          <CheckCircle2 size={12} className="text-white/40" />
                                        </button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {visibleLeads.length === 0 && (
                        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                          <Target size={44} strokeWidth={3} className="mb-5 text-white/18" />
                          <p className="text-sm font-black uppercase tracking-[0.28em] text-white/30">
                            {searchQuery || stageFilter !== "all"
                              ? "No leads match this view"
                              : column.id === META_PRIORITY_STATUS
                                ? "No Meta leads in queue"
                                : "No leads in this lane"}
                          </p>
                          <p className="mt-3 max-w-[220px] text-xs font-medium leading-relaxed text-white/30">
                            {column.id === META_PRIORITY_STATUS
                              ? "Fresh Meta instant-form leads will appear here for the whole setter team until the first outreach claims them."
                              : "Adjust your filters or add a new lead to get this column moving again."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {expandedLead && (
            <motion.aside
              key={expandedLead.id}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 28 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="hidden min-h-0 lg:block"
            >
              {renderLeadPanelContent}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {expandedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => void closeLeadPanel()}
          >
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 top-12 rounded-t-[2rem] p-3"
              onClick={(event) => event.stopPropagation()}
            >
              {renderLeadPanelContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FollowUpModal
        isOpen={isFollowUpOpen}
        onClose={() => setIsFollowUpOpen(false)}
        lead={selectedLead ? toFollowUpLead(selectedLead) : null}
        defaultTab={followUpTab}
      />

      <AddLeadModal isOpen={isAddLeadModalOpen} onClose={() => setIsAddLeadModalOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.32);
        }
      `}</style>
    </div>
  );
}
