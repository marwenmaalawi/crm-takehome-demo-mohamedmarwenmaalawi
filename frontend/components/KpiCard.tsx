type Tone = 'brand' | 'danger' | 'warning' | 'success' | 'neutral';

const toneStyles: Record<Tone, { value: string; accent: string }> = {
  brand: { value: 'text-brand-700', accent: 'bg-brand-500' },
  danger: { value: 'text-danger-text', accent: 'bg-danger-base' },
  warning: { value: 'text-warning-text', accent: 'bg-warning-base' },
  success: { value: 'text-success-text', accent: 'bg-success-base' },
  neutral: { value: 'text-slate-700', accent: 'bg-slate-400' },
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
    <div className="card relative overflow-hidden p-5">
      <span className={`absolute inset-y-0 left-0 w-1 ${s.accent}`} aria-hidden />
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${s.value}`}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}
