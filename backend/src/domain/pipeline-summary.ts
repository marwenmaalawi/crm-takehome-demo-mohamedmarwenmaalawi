import {
  OPPORTUNITY_STAGE_ORDER,
  OpportunityStatus,
  ProblemFlag,
  type OpportunityStage,
  type PipelineSummary,
} from '@crm/contracts';
import { assessProblem } from './opportunity-problem';

/**
 * Pure pipeline aggregation (DECISIONS.md §4). Monetary sums are accumulated in integer
 * cents to avoid floating-point drift, then rendered back to 2-decimal strings.
 *
 * @author Mohamed Marwen Maalawi
 */
export interface PipelineInput {
  status: OpportunityStatus;
  stage: OpportunityStage;
  amount: string; // 2-decimal string, EUR
  expectedCloseDate: Date;
  stageChangedAt: Date;
  lastActivityAt?: Date | null;
}

const toCents = (amount: string): number => Math.round(Number(amount) * 100);
const fromCents = (cents: number): string => (cents / 100).toFixed(2);

export function computePipelineSummary(items: PipelineInput[], now: Date = new Date()): PipelineSummary {
  const stageCents: Record<OpportunityStage, number> = {
    NEW: 0,
    QUALIFIED: 0,
    PROPOSAL: 0,
    NEGOTIATION: 0,
  };
  const stageCount: Record<OpportunityStage, number> = {
    NEW: 0,
    QUALIFIED: 0,
    PROPOSAL: 0,
    NEGOTIATION: 0,
  };

  let openCents = 0;
  let openCount = 0;
  let overdueCents = 0;
  let overdueCount = 0;
  let stalledCents = 0;
  let stalledCount = 0;
  let wonCount = 0;
  let lostCount = 0;

  for (const item of items) {
    if (item.status === OpportunityStatus.WON) {
      wonCount += 1;
      continue;
    }
    if (item.status === OpportunityStatus.LOST) {
      lostCount += 1;
      continue;
    }

    // OPEN from here on.
    const cents = toCents(item.amount);
    openCents += cents;
    openCount += 1;
    stageCents[item.stage] += cents;
    stageCount[item.stage] += 1;

    const problem = assessProblem(item, now);
    if (problem.flags.includes(ProblemFlag.OVERDUE)) {
      overdueCents += cents;
      overdueCount += 1;
    }
    if (problem.flags.includes(ProblemFlag.STALLED)) {
      stalledCents += cents;
      stalledCount += 1;
    }
  }

  const closed = wonCount + lostCount;

  return {
    openTotalValue: fromCents(openCents),
    openCount,
    byStage: OPPORTUNITY_STAGE_ORDER.map((stage) => ({
      stage,
      count: stageCount[stage],
      value: fromCents(stageCents[stage]),
    })),
    overdue: { count: overdueCount, value: fromCents(overdueCents) },
    stalled: { count: stalledCount, value: fromCents(stalledCents) },
    conversionRate: closed === 0 ? null : wonCount / closed,
    wonCount,
    lostCount,
    generatedAt: now.toISOString(),
  };
}
