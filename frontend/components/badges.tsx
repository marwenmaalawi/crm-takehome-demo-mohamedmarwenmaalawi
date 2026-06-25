import {
  OpportunityStatus,
  ProblemFlag,
  type ClientType,
  type OpportunityStage,
  type ProblemAssessment,
} from '@crm/contracts';
import {
  clientTypeLabels,
  problemFlagLabels,
  stageLabels,
  statusLabels,
  t,
  type Locale,
} from '@/lib/i18n';

function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {children}
    </span>
  );
}

const stageTones: Record<OpportunityStage, string> = {
  NEW: 'bg-slate-100 text-slate-600',
  QUALIFIED: 'bg-info-soft text-info-text',
  PROPOSAL: 'bg-brand-50 text-brand-700',
  NEGOTIATION: 'bg-warning-soft text-warning-text',
};

export function StageBadge({ stage, locale }: { stage: OpportunityStage; locale: Locale }) {
  return <Pill tone={stageTones[stage]}>{stageLabels[locale][stage]}</Pill>;
}

const statusTones: Record<OpportunityStatus, string> = {
  OPEN: 'bg-info-soft text-info-text',
  WON: 'bg-success-soft text-success-text',
  LOST: 'bg-neutral-soft text-neutral-text',
};

export function StatusBadge({ status, locale }: { status: OpportunityStatus; locale: Locale }) {
  return <Pill tone={statusTones[status]}>{statusLabels[locale][status]}</Pill>;
}

export function ClientTypeBadge({ type, locale }: { type: ClientType; locale: Locale }) {
  return <Pill tone="bg-slate-100 text-slate-600">{clientTypeLabels[locale][type]}</Pill>;
}

const flagTones: Record<ProblemFlag, string> = {
  OVERDUE: 'bg-danger-soft text-danger-text',
  STALLED: 'bg-warning-soft text-warning-text',
};

/** Renders one badge per problem flag, with the human reason as a tooltip. */
export function ProblemBadges({
  problem,
  locale,
  showHealthy = false,
}: {
  problem: ProblemAssessment;
  locale: Locale;
  showHealthy?: boolean;
}) {
  if (!problem.isProblem) {
    return showHealthy ? <Pill tone="bg-success-soft text-success-text">{t(locale, 'problem.healthy')}</Pill> : null;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {problem.flags.map((flag, i) => (
        <span key={flag} title={problem.reasons[i]}>
          <Pill tone={flagTones[flag]}>
            <span aria-hidden>●</span>
            {problemFlagLabels[locale][flag]}
          </Pill>
        </span>
      ))}
    </span>
  );
}
