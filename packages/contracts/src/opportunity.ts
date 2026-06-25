import { z } from 'zod';
import {
  clientTypeSchema,
  opportunityStageSchema,
  opportunityStatusSchema,
  problemFlagSchema,
  OpportunityStatus,
} from './enums';
import { clientSchema } from './client';
import { activitySchema } from './activity';

/**
 * Opportunity contracts. Money is a decimal string end-to-end (never a JS float)
 * to avoid rounding drift (see DECISIONS.md §5).
 */

/** A positive monetary amount in EUR, transported as a string with up to 2 decimals. */
export const amountSchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v.toString() : v.trim()))
  .pipe(
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Montant invalide (ex. 12500 ou 12500.50)')
      .refine((v) => Number(v) > 0, 'Le montant doit être strictement positif'),
  );

/** Date-only (YYYY-MM-DD), interpreted in Europe/Paris (see DECISIONS.md §3). */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ');

const opportunityWritable = {
  title: z.string().trim().min(1, 'Titre requis').max(160),
  clientId: z.string().uuid('Client invalide'),
  amount: amountSchema,
  expectedCloseDate: dateOnlySchema,
  stage: opportunityStageSchema,
  status: opportunityStatusSchema.default(OpportunityStatus.OPEN),
  ownerName: z.string().trim().min(1, 'Responsable requis').max(120),
  notes: z.string().trim().max(2000).optional().nullable(),
  nextStep: z.string().trim().max(200).optional().nullable(),
  nextStepDueAt: dateOnlySchema.optional().nullable(),
};

export const createOpportunitySchema = z.object(opportunityWritable);
export type CreateOpportunityDto = z.infer<typeof createOpportunitySchema>;

/** All fields optional on update (PATCH semantics). */
export const updateOpportunitySchema = z
  .object(opportunityWritable)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Aucun champ à mettre à jour');
export type UpdateOpportunityDto = z.infer<typeof updateOpportunitySchema>;

/** Computed problem assessment attached to each opportunity on read. */
export const problemAssessmentSchema = z.object({
  isProblem: z.boolean(),
  flags: z.array(problemFlagSchema),
  /** Days overdue (>0) when OVERDUE, else null. */
  overdueDays: z.number().int().nullable(),
  /** Days since last stage change when STALLED, else null. */
  stalledDays: z.number().int().nullable(),
  /** Human-readable French reasons, e.g. "En retard de 12 j". */
  reasons: z.array(z.string()),
});
export type ProblemAssessment = z.infer<typeof problemAssessmentSchema>;

export const opportunitySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  amount: z.string(),
  /** Client display name, present when the client relation was loaded (list, board, detail). */
  clientName: z.string().nullable(),
  expectedCloseDate: z.string(),
  stage: opportunityStageSchema,
  status: opportunityStatusSchema,
  ownerName: z.string(),
  notes: z.string().nullable(),
  nextStep: z.string().nullable(),
  nextStepDueAt: z.string().nullable(),
  stageChangedAt: z.string(),
  lastActivityAt: z.string().nullable(),
  /** Days since the last activity (or stage change if none) — aging signal. */
  daysSinceLastActivity: z.number().int().nullable(),
  /** Days the opportunity has spent in its current stage. */
  daysInStage: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  clientId: z.string().uuid(),
  problem: problemAssessmentSchema,
});
export type OpportunityDto = z.infer<typeof opportunitySchema>;

/** Detail view embeds the full client and the activity timeline (most recent first). */
export const opportunityWithClientSchema = opportunitySchema.extend({
  client: clientSchema,
  activities: z.array(activitySchema),
});
export type OpportunityWithClientDto = z.infer<typeof opportunityWithClientSchema>;

/* ----------------------------- list query params ---------------------------- */

const sortableFields = ['expectedCloseDate', 'amount', 'createdAt'] as const;

export const listOpportunitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  stage: opportunityStageSchema.optional(),
  status: opportunityStatusSchema.optional(),
  clientType: clientTypeSchema.optional(),
  /** Restrict to a single client (used by the client detail page). */
  clientId: z.string().uuid().optional(),
  /** Free-text search on opportunity title or client display name. */
  search: z.string().trim().max(160).optional(),
  /** Restrict to problematic opportunities (overdue or stalled). */
  problemOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(sortableFields).default('expectedCloseDate'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});
export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesQuerySchema>;
