export const META_PRIORITY_STATUS = "meta_priority";
export const META_PRIORITY_OVERDUE_MINUTES = 5;
export const META_PRIORITY_ESCALATED_MINUTES = 10;
export const META_PRIORITY_OVERDUE_MS = META_PRIORITY_OVERDUE_MINUTES * 60 * 1000;
export const META_PRIORITY_ESCALATED_MS = META_PRIORITY_ESCALATED_MINUTES * 60 * 1000;

export type MetaPrioritySlaState = "fresh" | "overdue" | "escalated";

export function isMetaLeadSource(source: unknown): boolean {
  return typeof source === "string" && source === "meta_lead_ad";
}

export function isMetaPriorityStatus(status: unknown): boolean {
  return typeof status === "string" && status === META_PRIORITY_STATUS;
}

export function isMetaPriorityLead(input: { status?: unknown; source?: unknown }): boolean {
  return isMetaPriorityStatus(input.status) && isMetaLeadSource(input.source);
}

export function resolveMetaPriorityCreatedAt(
  metadata: Record<string, unknown> | null | undefined,
  createdAt?: string | null,
) {
  if (typeof metadata?.meta_priority_created_at === "string" && metadata.meta_priority_created_at.trim()) {
    return metadata.meta_priority_created_at;
  }

  return createdAt || null;
}

export function getMetaPriorityAgeMs(createdAt?: string | null, now = Date.now()): number {
  if (!createdAt) return 0;
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, now - timestamp);
}

export function getMetaPrioritySlaState(createdAt?: string | null, now = Date.now()): MetaPrioritySlaState {
  const ageMs = getMetaPriorityAgeMs(createdAt, now);

  if (ageMs >= META_PRIORITY_ESCALATED_MS) return "escalated";
  if (ageMs >= META_PRIORITY_OVERDUE_MS) return "overdue";
  return "fresh";
}

export function formatMetaPriorityAge(createdAt?: string | null, now = Date.now()): string {
  const ageMs = getMetaPriorityAgeMs(createdAt, now);
  const ageMinutes = Math.floor(ageMs / 60000);

  if (ageMinutes < 1) return "Just in";
  if (ageMinutes < 60) return `${ageMinutes}m waiting`;

  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours}h waiting`;

  const ageDays = Math.floor(ageHours / 24);
  return `${ageDays}d waiting`;
}
