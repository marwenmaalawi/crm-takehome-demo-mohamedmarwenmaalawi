type Tone = 'brand' | 'danger' | 'warning' | 'success' | 'neutral';

const toneStyles: Record<Tone, { value: string; accent: string; bg: string }> = {
  brand:   { value: 'text-brand-700',   accent: 'bg-brand-500',   bg: 'bg-brand-50' },
  danger:  { value: 'text-danger-text',  accent: 'bg-danger-base',  bg: 'bg-danger-soft' },
  warning: { value: 'text-warning-text', accent: 'bg-warning-base', bg: 'bg-warning-soft' },
  success: { value: 'text-success-text', accent: 'bg-success-base', bg: 'bg-success-soft' },
  neutral: { value: 'text-slate-700',   accent: 'bg-slate-400',   bg: 'bg-slate-50' },
};

export function KpiCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
}) {
  const s = toneStyles[tone];
  return (
    <div className={`card relative overflow-hidden p-5 ${s.bg}/40`}>
      {/* Left accent bar — quick visual grouping for scanning */}
      <span className={`absolute inset-y-0 left-0 w-1 rounded-l-xl ${s.accent}`} aria-hidden />

      <div className="pl-1">
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</div>
        <div className={`mt-2 text-2xl font-bold tracking-tight ${s.value}`}>{value}</div>
        {hint ? (
          <div className="mt-1 text-xs text-slate-400">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
