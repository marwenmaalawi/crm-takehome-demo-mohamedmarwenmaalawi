import { z } from 'zod';
import { opportunityStageSchema } from './enums';
import { opportunitySchema } from './opportunity';

/**
 * Pipeline recap (aggregation) contract — see DECISIONS.md §4.
 * All monetary totals are decimal strings (EUR).
 */

export const stageBreakdownSchema = z.object({
  stage: opportunityStageSchema,
  count: z.number().int(),
  value: z.string(),
});
export type StageBreakdown = z.infer<typeof stageBreakdownSchema>;

export const moneyCountSchema = z.object({
  count: z.number().int(),
  value: z.string(),
});
export type MoneyCount = z.infer<typeof moneyCountSchema>;

export const pipelineSummarySchema = z.object({
  /** Total value of all OPEN opportunities. */
  openTotalValue: z.string(),
  openCount: z.number().int(),
  /** Count + value per stage (OPEN only), ordered. */
  byStage: z.array(stageBreakdownSchema),
  /** Overdue exposure (OPEN & past expected close date). */
  overdue: moneyCountSchema,
  /** Stalled exposure (OPEN & no stage change for the threshold window). */
  stalled: moneyCountSchema,
  /** won / (won + lost); null when no closed deals yet. */
  conversionRate: z.number().min(0).max(1).nullable(),
  wonCount: z.number().int(),
  lostCount: z.number().int(),
  generatedAt: z.string(),
});
export type PipelineSummary = z.infer<typeof pipelineSummarySchema>;

/**
 * The dashboard "attention" feed (DECISIONS.md §4 bis): the actionable lists a sales rep
 * should look at first. Each list is capped server-side.
 */
export const pipelineAttentionSchema = z.object({
  overdue: z.array(opportunitySchema),
  stalled: z.array(opportunitySchema),
  /** OPEN opportunities whose expected close date falls within the upcoming window. */
  upcomingSignatures: z.array(opportunitySchema),
});
export type PipelineAttention = z.infer<typeof pipelineAttentionSchema>;

/** One pipeline column: a stage with its OPEN opportunities and totals. */
export const pipelineStageColumnSchema = z.object({
  stage: opportunityStageSchema,
  count: z.number().int(),
  value: z.string(),
  opportunities: z.array(opportunitySchema),
});
export type PipelineStageColumn = z.infer<typeof pipelineStageColumnSchema>;

/** The full pipeline board — one column per stage, in display order. */
export const pipelineBoardSchema = z.array(pipelineStageColumnSchema);
export type PipelineBoard = z.infer<typeof pipelineBoardSchema>;
