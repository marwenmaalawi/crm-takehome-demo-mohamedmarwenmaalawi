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
    <form onSubmit={onSubmit} className="form-shell">
      {/* Global form error */}
      {formError ? (
        <div
          role="alert"
          className="rounded-lg border border-danger-base/30 bg-danger-soft px-4 py-3 text-sm text-danger-text"
        >
          {formError}
        </div>
      ) : null}

      {/* ── Section 1: Opportunité ── */}
      <div>
        <p className="form-section-title">{isEdit ? t(locale, 'form.editTitle') : t(locale, 'form.newTitle')}</p>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="label" htmlFor="opp-title">
              {t(locale, 'form.title')} <span className="text-danger-text">*</span>
            </label>
            <input id="opp-title" className="input" autoFocus={!isEdit} {...register('title')} />
            {errors.title ? <p className="field-error">{errors.title.message}</p> : null}
          </div>

          {/* Client */}
          <div>
            <label className="label" htmlFor="opp-clientId">
              {t(locale, 'form.client')} <span className="text-danger-text">*</span>
            </label>
            <select id="opp-clientId" className="input" {...register('clientId')}>
              <option value="">{t(locale, 'form.selectClient')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientLabel(c)}
                </option>
              ))}
            </select>
            {errors.clientId ? <p className="field-error">{errors.clientId.message}</p> : null}
          </div>

          {/* Amount + Close date — 2-col on sm+ */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="opp-amount">
                {t(locale, 'form.amount')} <span className="text-danger-text">*</span>
              </label>
              <input id="opp-amount" inputMode="decimal" className="input" placeholder="0.00" {...register('amount')} />
              {errors.amount ? <p className="field-error">{errors.amount.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="opp-expectedCloseDate">
                {t(locale, 'form.closeDate')} <span className="text-danger-text">*</span>
              </label>
              <input id="opp-expectedCloseDate" type="date" className="input" {...register('expectedCloseDate')} />
              {errors.expectedCloseDate ? (
                <p className="field-error">{errors.expectedCloseDate.message}</p>
              ) : null}
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="label" htmlFor="opp-ownerName">
              {t(locale, 'form.owner')} <span className="text-danger-text">*</span>
            </label>
            <input id="opp-ownerName" className="input" {...register('ownerName')} />
            {errors.ownerName ? <p className="field-error">{errors.ownerName.message}</p> : null}
          </div>
        </div>
      </div>

      {/* ── Section 2: Pipeline ── */}
      <div className="form-section">
        <p className="form-section-title">Pipeline</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="opp-stage">
              {t(locale, 'form.stage')}
            </label>
            <select id="opp-stage" className="input" {...register('stage')}>
              {Object.values(OpportunityStage).map((s) => (
                <option key={s} value={s}>
                  {stageLabels[locale][s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="opp-status">
              {t(locale, 'form.status')}
            </label>
            <select id="opp-status" className="input" {...register('status')}>
              {Object.values(OpportunityStatus).map((s) => (
                <option key={s} value={s}>
                  {statusLabels[locale][s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 3: Prochaine action ── */}
      <div className="form-section">
        <p className="form-section-title">{t(locale, 'opp.nextStep')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="opp-nextStep">
              {t(locale, 'form.nextStep')}
            </label>
            <input id="opp-nextStep" className="input" {...register('nextStep')} />
            {errors.nextStep ? <p className="field-error">{errors.nextStep.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="opp-nextStepDueAt">
              {t(locale, 'form.nextStepDue')}
            </label>
            <input id="opp-nextStepDueAt" type="date" className="input" {...register('nextStepDueAt')} />
            {errors.nextStepDueAt ? <p className="field-error">{errors.nextStepDueAt.message}</p> : null}
          </div>
        </div>
      </div>

      {/* ── Section 4: Notes ── */}
      <div className="form-section">
        <p className="form-section-title">{t(locale, 'detail.notes')}</p>
        <div>
          <label className="label" htmlFor="opp-notes">
            {t(locale, 'form.notes')}
          </label>
          <textarea id="opp-notes" rows={4} className="input resize-y" {...register('notes')} />
          {errors.notes ? <p className="field-error">{errors.notes.message}</p> : null}
        </div>
      </div>

      {/* ── Actions: sticky on mobile, inline on sm+ ── */}
      <div className="form-actions">
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
