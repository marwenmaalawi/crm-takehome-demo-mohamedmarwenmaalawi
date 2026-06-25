import {
  OPPORTUNITY_STAGE_ORDER,
  type OpportunityDto,
  type OpportunityStage,
  type PipelineBoard,
} from '@crm/contracts';

/**
 * Group OPEN opportunities into one column per stage (in display order), with per-stage
 * count and total value. Pure so the grouping/totals are unit-testable. Money summed in
 * integer cents to avoid floating-point drift.
 *
 * @author Mohamed Marwen Maalawi
 */
export function computePipelineBoard(openOpportunities: OpportunityDto[]): PipelineBoard {
  const byStage = new Map<OpportunityStage, OpportunityDto[]>();
  for (const stage of OPPORTUNITY_STAGE_ORDER) byStage.set(stage, []);
  for (const opp of openOpportunities) byStage.get(opp.stage)?.push(opp);

  return OPPORTUNITY_STAGE_ORDER.map((stage) => {
    const opportunities = byStage.get(stage) ?? [];
    const cents = opportunities.reduce((sum, o) => sum + Math.round(Number(o.amount) * 100), 0);
    return { stage, count: opportunities.length, value: (cents / 100).toFixed(2), opportunities };
  });
}
