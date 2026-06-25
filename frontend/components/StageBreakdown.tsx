import type { StageBreakdown as StageBreakdownItem } from '@crm/contracts';
import { stageLabels, type Locale } from '@/lib/i18n';
import { formatCurrency } from '@/lib/format';

const stageBar: Record<string, string> = {
  NEW: 'bg-slate-400',
  QUALIFIED: 'bg-info-base',
  PROPOSAL: 'bg-brand-500',
  NEGOTIATION: 'bg-warning-base',
};

/** Horizontal value-per-stage breakdown — a manager's at-a-glance read of where value sits. */
export function StageBreakdown({
  items,
  locale,
}: {
  items: StageBreakdownItem[];
  locale: Locale;
}) {
  const max = Math.max(1, ...items.map((i) => Number(i.value)));

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = (Number(item.value) / max) * 100;
        return (
          <div key={item.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{stageLabels[locale][item.stage]}</span>
              <span className="tabular-nums text-slate-500">
                {formatCurrency(item.value, locale)} · {item.count}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${stageBar[item.stage]}`}
                style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
