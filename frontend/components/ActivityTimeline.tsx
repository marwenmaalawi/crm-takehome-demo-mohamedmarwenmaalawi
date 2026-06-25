import { ActivityType, type ActivityDto } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { formatTimestamp } from '@/lib/format';

const meta: Record<ActivityType, { icon: string; tone: string }> = {
  CALL: { icon: '☎', tone: 'bg-info-soft text-info-text' },
  EMAIL: { icon: '✉', tone: 'bg-brand-50 text-brand-700' },
  MEETING: { icon: '◷', tone: 'bg-warning-soft text-warning-text' },
  NOTE: { icon: '✎', tone: 'bg-slate-100 text-slate-600' },
};

export function ActivityTimeline({
  activities,
  locale,
}: {
  activities: ActivityDto[];
  locale: Locale;
}) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-400">{t(locale, 'activity.none')}</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-slate-200 pl-6">
      {activities.map((a) => {
        const m = meta[a.type];
        return (
          <li key={a.id} className="relative">
            <span
              className={`absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full text-xs ${m.tone}`}
              aria-hidden
            >
              {m.icon}
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t(locale, `activity.${a.type}` as 'activity.CALL')}
              </span>
              <span className="text-xs tabular-nums text-slate-400">
                {formatTimestamp(a.occurredAt, locale)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-700">{a.summary}</p>
            <p className="text-xs text-slate-400">{a.authorName}</p>
          </li>
        );
      })}
    </ol>
  );
}
