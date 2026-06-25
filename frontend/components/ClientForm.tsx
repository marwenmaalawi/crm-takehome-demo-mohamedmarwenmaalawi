'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  ClientType,
  createClientSchema,
  headcountBandSchema,
  updateClientSchema,
} from '@crm/contracts';
import { clientTypeLabels, t, type Locale } from '@/lib/i18n';
import { ApiRequestError, createClient, updateClient } from '@/lib/api';

interface ClientFormValues {
  type: ClientType;
  legalName: string;
  siren: string;
  industry: string;
  headcount: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownerName: string;
}

const EMPTY: ClientFormValues = {
  type: ClientType.COMPANY,
  legalName: '',
  siren: '',
  industry: '',
  headcount: '',
  contactName: '',
  contactRole: '',
  contactEmail: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ownerName: '',
};

const trimmedOrUndefined = (v: string): string | undefined => (v.trim() === '' ? undefined : v.trim());
const trimmedOrNull = (v: string): string | null => (v.trim() === '' ? null : v.trim());

export interface ClientFormProps {
  locale: Locale;
  clientId?: string;
  defaults?: Partial<ClientFormValues>;
}

export function ClientForm({ locale, clientId, defaults }: ClientFormProps) {
  const router = useRouter();
  const isEdit = Boolean(clientId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ defaultValues: { ...EMPTY, ...defaults } });

  const type = watch('type');

  /** Map server field errors back onto the matching form fields. */
  const applyFieldErrors = (issues: { path: string; message: string }[]) => {
    issues.forEach(({ path, message }) => {
      if (path in EMPTY) setError(path as keyof ClientFormValues, { message });
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      let saved;
      if (isEdit) {
        const payload = {
          email: trimmedOrNull(values.email),
          phone: trimmedOrNull(values.phone),
          ownerName: values.ownerName,
          ...(values.type === ClientType.COMPANY
            ? {
                legalName: values.legalName,
                siren: trimmedOrNull(values.siren),
                industry: trimmedOrNull(values.industry),
                headcount: trimmedOrNull(values.headcount),
                contactName: trimmedOrNull(values.contactName),
                contactRole: trimmedOrNull(values.contactRole),
                contactEmail: trimmedOrNull(values.contactEmail),
              }
            : { firstName: values.firstName, lastName: values.lastName }),
        };
        const parsed = updateClientSchema.safeParse(payload);
        if (!parsed.success) {
          applyFieldErrors(parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })));
          return;
        }
        saved = await updateClient(clientId as string, parsed.data);
      } else {
        const payload = {
          type: values.type,
          ownerName: values.ownerName,
          email: trimmedOrUndefined(values.email),
          phone: trimmedOrUndefined(values.phone),
          ...(values.type === ClientType.COMPANY
            ? {
                legalName: values.legalName,
                siren: trimmedOrUndefined(values.siren),
                industry: trimmedOrUndefined(values.industry),
                headcount: trimmedOrUndefined(values.headcount),
                contactName: trimmedOrUndefined(values.contactName),
                contactRole: trimmedOrUndefined(values.contactRole),
                contactEmail: trimmedOrUndefined(values.contactEmail),
              }
            : { firstName: values.firstName, lastName: values.lastName }),
        };
        const parsed = createClientSchema.safeParse(payload);
        if (!parsed.success) {
          applyFieldErrors(parsed.error.issues.map((i) => ({ path: String(i.path[0] ?? ''), message: i.message })));
          return;
        }
        saved = await createClient(parsed.data);
      }

      router.push(`/clients/${saved.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.details?.length) {
        applyFieldErrors(err.details);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'Erreur');
      }
    }
  });

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

      {/* ── Section 1: Type ── */}
      <div>
        <p className="form-section-title">
          {isEdit ? t(locale, 'clientForm.editTitle') : t(locale, 'clientForm.newTitle')}
        </p>
        <div>
          <label className="label" htmlFor="client-type">
            {t(locale, 'clientForm.type')} <span className="text-danger-text">*</span>
          </label>
          <select id="client-type" className="input" disabled={isEdit} {...register('type')}>
            {Object.values(ClientType).map((c) => (
              <option key={c} value={c}>
                {clientTypeLabels[locale][c]}
              </option>
            ))}
          </select>
          {isEdit ? (
            <p className="mt-1 text-xs text-slate-400">Le type de client ne peut pas être modifié après création.</p>
          ) : null}
        </div>
      </div>

      {/* ── Section 2: Company-specific fields ── */}
      {type === ClientType.COMPANY ? (
        <div className="form-section">
          <p className="form-section-title">{t(locale, 'clientDetail.info')}</p>
          <div className="space-y-4">
            {/* Legal name */}
            <div>
              <label className="label" htmlFor="client-legalName">
                {t(locale, 'clientForm.legalName')} <span className="text-danger-text">*</span>
              </label>
              <input id="client-legalName" className="input" autoFocus={!isEdit} {...register('legalName')} />
              {errors.legalName ? <p className="field-error">{errors.legalName.message}</p> : null}
            </div>

            {/* SIREN + Industry + Headcount — 3-col on sm+ */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="client-siren">
                  {t(locale, 'clientForm.siren')}
                </label>
                <input id="client-siren" className="input" {...register('siren')} />
                {errors.siren ? <p className="field-error">{errors.siren.message}</p> : null}
              </div>
              <div>
                <label className="label" htmlFor="client-industry">
                  {t(locale, 'clientForm.industry')}
                </label>
                <input id="client-industry" className="input" {...register('industry')} />
              </div>
              <div>
                <label className="label" htmlFor="client-headcount">
                  {t(locale, 'clientForm.headcount')}
                </label>
                <select id="client-headcount" className="input" {...register('headcount')}>
                  <option value="">—</option>
                  {headcountBandSchema.options.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Primary contact */}
            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-xs font-medium text-slate-500">
                {t(locale, 'clientDetail.contact')}
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label" htmlFor="client-contactName">
                    {t(locale, 'clientForm.firstName')} / {t(locale, 'clientForm.lastName')}
                  </label>
                  <input id="client-contactName" className="input" {...register('contactName')} />
                </div>
                <div>
                  <label className="label" htmlFor="client-contactRole">
                    {t(locale, 'clientForm.owner')}
                  </label>
                  <input id="client-contactRole" className="input" {...register('contactRole')} />
                </div>
                <div>
                  <label className="label" htmlFor="client-contactEmail">
                    {t(locale, 'clientForm.email')}
                  </label>
                  <input
                    id="client-contactEmail"
                    type="email"
                    className="input"
                    {...register('contactEmail')}
                  />
                  {errors.contactEmail ? <p className="field-error">{errors.contactEmail.message}</p> : null}
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      ) : (
        /* ── Section 2 (Individual): first name + last name ── */
        <div className="form-section">
          <p className="form-section-title">{t(locale, 'clientDetail.info')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="client-firstName">
                {t(locale, 'clientForm.firstName')} <span className="text-danger-text">*</span>
              </label>
              <input id="client-firstName" className="input" autoFocus={!isEdit} {...register('firstName')} />
              {errors.firstName ? <p className="field-error">{errors.firstName.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="client-lastName">
                {t(locale, 'clientForm.lastName')} <span className="text-danger-text">*</span>
              </label>
              <input id="client-lastName" className="input" {...register('lastName')} />
              {errors.lastName ? <p className="field-error">{errors.lastName.message}</p> : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 3: Contact + Responsable ── */}
      <div className="form-section">
        <p className="form-section-title">Contact &amp; Responsable</p>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="client-email">
                {t(locale, 'clientForm.email')}
              </label>
              <input id="client-email" type="email" className="input" {...register('email')} />
              {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="client-phone">
                {t(locale, 'clientForm.phone')}
              </label>
              <input id="client-phone" type="tel" className="input" {...register('phone')} />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="client-ownerName">
              {t(locale, 'clientForm.owner')} <span className="text-danger-text">*</span>
            </label>
            <input id="client-ownerName" className="input" {...register('ownerName')} />
            {errors.ownerName ? <p className="field-error">{errors.ownerName.message}</p> : null}
          </div>
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
