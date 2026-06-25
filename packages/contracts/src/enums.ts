import { z } from 'zod';

/**
 * Domain enums — single source of truth shared by the API and the UI.
 * Author: Mohamed Marwen Maalawi.
 */

export const ClientType = {
  COMPANY: 'COMPANY',
  INDIVIDUAL: 'INDIVIDUAL',
} as const;
export const clientTypeSchema = z.nativeEnum(ClientType);
export type ClientType = z.infer<typeof clientTypeSchema>;

/** Ordered advancement steps of an OPEN opportunity. */
export const OpportunityStage = {
  NEW: 'NEW',
  QUALIFIED: 'QUALIFIED',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATION: 'NEGOTIATION',
} as const;
export const opportunityStageSchema = z.nativeEnum(OpportunityStage);
export type OpportunityStage = z.infer<typeof opportunityStageSchema>;

/** Display order for the pipeline (kanban / breakdown). */
export const OPPORTUNITY_STAGE_ORDER: OpportunityStage[] = [
  OpportunityStage.NEW,
  OpportunityStage.QUALIFIED,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION,
];

/** Outcome of an opportunity — kept separate from `stage` (see DECISIONS.md §2). */
export const OpportunityStatus = {
  OPEN: 'OPEN',
  WON: 'WON',
  LOST: 'LOST',
} as const;
export const opportunityStatusSchema = z.nativeEnum(OpportunityStatus);
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;

/** Derived "problem" signals (never stored — computed on read, see DECISIONS.md §3). */
export const ProblemFlag = {
  OVERDUE: 'OVERDUE',
  STALLED: 'STALLED',
} as const;
export const problemFlagSchema = z.nativeEnum(ProblemFlag);
export type ProblemFlag = z.infer<typeof problemFlagSchema>;

/** Number of days without activity after which an OPEN opportunity is "stalled". */
export const STALLED_THRESHOLD_DAYS = 14;

/** Number of days ahead within which an upcoming signature is "imminent" (dashboard). */
export const UPCOMING_SIGNATURE_WINDOW_DAYS = 30;

/** Type of logged interaction on an opportunity (the activity timeline). */
export const ActivityType = {
  CALL: 'CALL',
  EMAIL: 'EMAIL',
  MEETING: 'MEETING',
  NOTE: 'NOTE',
} as const;
export const activityTypeSchema = z.nativeEnum(ActivityType);
export type ActivityType = z.infer<typeof activityTypeSchema>;
