'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ActivityType, createActivitySchema } from '@crm/contracts';
import { t, type Locale } from '@/lib/i18n';
import { ApiRequestError, createActivity } from '@/lib/api';

/** Inline form to log an activity against an opportunity. */
export function LogActivityForm({ opportunityId, locale }: { opportunityId: string; locale: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ActivityType>(ActivityType.CALL);
  const [summary, setSummary] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = { type, summary, authorName, occurredAt: new Date(occurredAt).toISOString() };
    const parsed = createActivitySchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Données invalides');
      return;
    }

    setBusy(true);
    try {
      await createActivity(opportunityId, parsed.data);
      setSummary('');
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        + {t(locale, 'activity.log')}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {error ? <p className="field-error">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">{t(locale, 'activity.type')}</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
            {Object.values(ActivityType).map((v) => (
              <option key={v} value={v}>{t(locale, `activity.${v}` as 'activity.CALL')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t(locale, 'activity.date')}</label>
          <input
            type="datetime-local"
            className="input"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">{t(locale, 'activity.summary')}</label>
        <input className="input" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div>
        <label className="label">{t(locale, 'activity.author')}</label>
        <input className="input" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary text-sm" disabled={busy}>
          {busy ? t(locale, 'form.saving') : t(locale, 'activity.add')}
        </button>
        <button type="button" className="btn-secondary text-sm" onClick={() => setOpen(false)}>
          {t(locale, 'action.cancel')}
        </button>
      </div>
    </form>
  );
}
