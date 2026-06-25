'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  OpportunityStage,
  OpportunityStatus,
  createOpportunitySchema,
  type ClientDto,
  type CreateOpportunityDto,
} from '@crm/contracts';
import {
  clientTypeLabels,
  stageLabels,
  statusLabels,
  t,
  type Locale,
} from '@/lib/i18n';
import { ApiRequestError, createOpportunity, updateOpportunity } from '@/lib/api';

export interface OpportunityFormProps {
  locale: Locale;
  clients: ClientDto[];
  /** Present in edit mode. */
  opportunityId?: string;
  defaults?: Partial<CreateOpportunityDto>;
}

export function OpportunityForm({ locale, clients, opportunityId, defaults }: OpportunityFormProps) {
  const router = useRouter();
  const isEdit = Boolean(opportunityId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOpportunityDto>({
    resolver: zodResolver(createOpportunitySchema),
    defaultValues: {
      title: '',
      clientId: '',
      amount: '',
      expectedCloseDate: '',
      stage: OpportunityStage.NEW,
      status: OpportunityStatus.OPEN,
      ownerName: '',
      notes: '',
      nextStep: '',
      nextStepDueAt: '',
      ...defaults,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateOpportunity(opportunityId as string, data)
        : await createOpportunity(data);
      router.push(`/opportunities/${saved.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details?.length) {
        // Map server field errors back onto the form.
        err.details.forEach((d) => {
          if (d.path in (data as object)) {
            setError(d.path as keyof CreateOpportunityDto, { message: d.message });
          }
        });
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Erreur');
      }
    }
  });

  const clientLabel = (c: ClientDto) =>
    `${c.displayName} · ${clientTypeLabels[locale][c.type]}`;

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
      {formError ? (
        <div className="rounded-lg border border-danger-base/30 bg-danger-soft px-4 py-2 text-sm text-danger-text">
          {formError}
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="title">{t(locale, 'form.title')}</label>
        <input id="title" className="input" {...register('title')} />
        {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
      </div>

      <div>
        <label className="label" htmlFor="clientId">{t(locale, 'form.client')}</label>
        <select id="clientId" className="input" {...register('clientId')}>
          <option value="">{t(locale, 'form.selectClient')}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{clientLabel(c)}</option>
          ))}
        </select>
        {errors.clientId ? <p className="field-error">{errors.clientId.message}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">{t(locale, 'form.amount')}</label>
          <input id="amount" inputMode="decimal" className="input" {...register('amount')} />
          {errors.amount ? <p className="field-error">{errors.amount.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="expectedCloseDate">{t(locale, 'form.closeDate')}</label>
          <input id="expectedCloseDate" type="date" className="input" {...register('expectedCloseDate')} />
          {errors.expectedCloseDate ? (
            <p className="field-error">{errors.expectedCloseDate.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="stage">{t(locale, 'form.stage')}</label>
          <select id="stage" className="input" {...register('stage')}>
            {Object.values(OpportunityStage).map((s) => (
              <option key={s} value={s}>{stageLabels[locale][s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">{t(locale, 'form.status')}</label>
          <select id="status" className="input" {...register('status')}>
            {Object.values(OpportunityStatus).map((s) => (
              <option key={s} value={s}>{statusLabels[locale][s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ownerName">{t(locale, 'form.owner')}</label>
        <input id="ownerName" className="input" {...register('ownerName')} />
        {errors.ownerName ? <p className="field-error">{errors.ownerName.message}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nextStep">{t(locale, 'form.nextStep')}</label>
          <input id="nextStep" className="input" {...register('nextStep')} />
          {errors.nextStep ? <p className="field-error">{errors.nextStep.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="nextStepDueAt">{t(locale, 'form.nextStepDue')}</label>
          <input id="nextStepDueAt" type="date" className="input" {...register('nextStepDueAt')} />
          {errors.nextStepDueAt ? <p className="field-error">{errors.nextStepDueAt.message}</p> : null}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="notes">{t(locale, 'form.notes')}</label>
        <textarea id="notes" rows={3} className="input" {...register('notes')} />
        {errors.notes ? <p className="field-error">{errors.notes.message}</p> : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? t(locale, 'form.saving') : t(locale, 'action.save')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>
          {t(locale, 'action.cancel')}
        </button>
      </div>
    </form>
  );
}
