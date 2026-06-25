import { OPPORTUNITY_STAGE_ORDER, type OpportunityStage } from '@crm/contracts';
import { stageLabels, type Locale } from '@/lib/i18n';

/** Linear pipeline progress — instantly conveys where the deal stands. */
export function StageStepper({ stage, locale }: { stage: OpportunityStage; locale: Locale }) {
  const currentIdx = OPPORTUNITY_STAGE_ORDER.indexOf(stage);

  return (
    <ol className="flex items-center gap-1">
      {OPPORTUNITY_STAGE_ORDER.map((s, i) => {
        const done = i < currentIdx;
        const current = i === currentIdx;
        return (
          <li key={s} className="flex flex-1 items-center gap-1">
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`h-1.5 w-full rounded-full ${
                  done ? 'bg-brand-500' : current ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
              <span
                className={`mt-1.5 text-xs ${
                  current ? 'font-semibold text-brand-700' : done ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {stageLabels[locale][s]}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
