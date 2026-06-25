import { OpportunityStatus, type OpportunityDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';

export type Health = 'healthy' | 'atRisk' | 'inactive';

/**
 * Derived customer health (DECISIONS.md): at risk if any open deal is problematic,
 * healthy if there are open deals and none problematic, inactive if no open deals.
 */
export function deriveHealth(opportunities: OpportunityDto[]): Health {
  const open = opportunities.filter((o) => o.status === OpportunityStatus.OPEN);
  if (open.length === 0) return 'inactive';
  return open.some((o) => o.problem.isProblem) ? 'atRisk' : 'healthy';
}

const tones: Record<Health, string> = {
  healthy: 'bg-success-soft text-success-text',
  atRisk: 'bg-danger-soft text-danger-text',
  inactive: 'bg-neutral-soft text-neutral-text',
};

export function HealthBadge({ health, locale }: { health: Health; locale: Locale }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[health]}`}>
      {t(locale, `health.${health}` as 'health.healthy')}
    </span>
  );
}
