import type { StageBreakdown as StageBreakdownItem } from '@crm/contracts';
import { stageLabels, type Locale } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';

const stageBar: Record<string, string> = {
  NEW:         'bg-slate-400',
  QUALIFIED:   'bg-info-base',
  PROPOSAL:    'bg-brand-500',
  NEGOTIATION: 'bg-warning-base',
};

/**
 * Horizontal value-per-stage breakdown with percentage share.
 * A sales manager's at-a-glance read of where pipeline value sits.
 */
export function StageBreakdown({
  items,
  locale,
}: {
  items: StageBreakdownItem[];
  locale: Locale;
}) {
  const total = items.reduce((sum, i) => sum + Number(i.value), 0);
  const max = Math.max(1, ...items.map((i) => Number(i.value)));

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = (Number(item.value) / max) * 100;
        const sharePct = total > 0 ? Math.round((Number(item.value) / total) * 100) : 0;
        return (
          <div key={item.stage}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{stageLabels[locale][item.stage]}</span>
              <div className="flex items-center gap-3 tabular-nums">
                <span className="text-slate-400 text-xs">{item.count} opp. · {sharePct}%</span>
                <span className="font-medium text-slate-600">{formatCurrency(item.value, locale)}</span>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${stageBar[item.stage]}`}
                style={{ width: `${Math.max(pct, item.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
