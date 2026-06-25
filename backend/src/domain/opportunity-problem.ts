import {
  OpportunityStatus,
  ProblemFlag,
  STALLED_THRESHOLD_DAYS,
  type ProblemAssessment,
} from '@crm/contracts';
import { daysBetween, parisDateString, utcDateString } from './date.util';

/**
 * The "problem" rule (DECISIONS.md §3), as a pure function so it can be unit-tested
 * and reused identically by the list, detail and aggregation code paths.
 *
 *  - OVERDUE : OPEN and expectedCloseDate is strictly before today.
 *  - STALLED : OPEN and no activity for >= STALLED_THRESHOLD_DAYS. "Activity" means a
 *    logged interaction; if the opportunity has none, we fall back to the last stage
 *    change (a freshly created deal that nobody has touched can still go stalled).
 *
 * Only OPEN opportunities can be problematic — a WON/LOST deal is closed.
 *
 * @author Mohamed Marwen Maalawi
 */
export interface ProblemInput {
  status: OpportunityStatus;
  /** The `@db.Date` value (UTC midnight) as returned by Prisma. */
  expectedCloseDate: Date;
  /** The instant of the last stage change. */
  stageChangedAt: Date;
  /** The instant of the most recent logged activity, or null if none. */
  lastActivityAt?: Date | null;
}

export function assessProblem(input: ProblemInput, now: Date = new Date()): ProblemAssessment {
  const empty: ProblemAssessment = {
    isProblem: false,
    flags: [],
    overdueDays: null,
    stalledDays: null,
    reasons: [],
  };

  if (input.status !== OpportunityStatus.OPEN) {
    return empty;
  }

  const today = parisDateString(now);
  const flags: ProblemFlag[] = [];
  const reasons: string[] = [];

  // Overdue — compare calendar days.
  const overdueDays = daysBetween(utcDateString(input.expectedCloseDate), today);
  const isOverdue = overdueDays > 0;
  if (isOverdue) {
    flags.push(ProblemFlag.OVERDUE);
    reasons.push(`En retard de ${overdueDays} j`);
  }

  // Stalled — days since the last activity (or last stage change if no activity yet).
  const reference = input.lastActivityAt ?? input.stageChangedAt;
  const stalledDays = daysBetween(parisDateString(reference), today);
  const isStalled = stalledDays >= STALLED_THRESHOLD_DAYS;
  if (isStalled) {
    flags.push(ProblemFlag.STALLED);
    reasons.push(`Stagnante depuis ${stalledDays} j`);
  }

  return {
    isProblem: flags.length > 0,
    flags,
    overdueDays: isOverdue ? overdueDays : null,
    stalledDays: isStalled ? stalledDays : null,
    reasons,
  };
}
