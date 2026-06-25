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

  /** Map a list of {path, message} issues back onto the matching form fields. */
  const applyFieldErrors = (issues: { path: string; message: string }[]) => {
    issues.forEach(({ path, message }) => {
      if (path in EMPTY) setError(path as keyof ClientFormValues, { message });
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      // Validate with the SAME schema the API uses, then submit (branches kept
      // separate so the create/update DTO types narrow correctly).
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
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-5 p-6">
      {formError ? (
        <div className="rounded-lg border border-danger-base/30 bg-danger-soft px-4 py-2 text-sm text-danger-text">
          {formError}
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="type">{t(locale, 'clientForm.type')}</label>
        <select id="type" className="input" disabled={isEdit} {...register('type')}>
          {Object.values(ClientType).map((c) => (
            <option key={c} value={c}>{clientTypeLabels[locale][c]}</option>
          ))}
        </select>
      </div>

      {type === ClientType.COMPANY ? (
        <>
          <div>
            <label className="label" htmlFor="legalName">{t(locale, 'clientForm.legalName')}</label>
            <input id="legalName" className="input" {...register('legalName')} />
            {errors.legalName ? <p className="field-error">{errors.legalName.message}</p> : null}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="siren">{t(locale, 'clientForm.siren')}</label>
              <input id="siren" className="input" {...register('siren')} />
              {errors.siren ? <p className="field-error">{errors.siren.message}</p> : null}
            </div>
            <div>
              <label className="label" htmlFor="industry">{t(locale, 'clientForm.industry')}</label>
              <input id="industry" className="input" {...register('industry')} />
            </div>
            <div>
              <label className="label" htmlFor="headcount">{t(locale, 'clientForm.headcount')}</label>
              <select id="headcount" className="input" {...register('headcount')}>
                <option value="">—</option>
                {headcountBandSchema.options.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
          <fieldset className="rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-xs font-medium text-slate-500">
              {t(locale, 'clientDetail.contact')}
            </legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="contactName">{t(locale, 'clientForm.firstName')} / {t(locale, 'clientForm.lastName')}</label>
                <input id="contactName" className="input" {...register('contactName')} />
              </div>
              <div>
                <label className="label" htmlFor="contactRole">{t(locale, 'clientForm.owner')}</label>
                <input id="contactRole" className="input" {...register('contactRole')} />
              </div>
              <div>
                <label className="label" htmlFor="contactEmail">{t(locale, 'clientForm.email')}</label>
                <input id="contactEmail" type="email" className="input" {...register('contactEmail')} />
                {errors.contactEmail ? <p className="field-error">{errors.contactEmail.message}</p> : null}
              </div>
            </div>
          </fieldset>
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="firstName">{t(locale, 'clientForm.firstName')}</label>
            <input id="firstName" className="input" {...register('firstName')} />
            {errors.firstName ? <p className="field-error">{errors.firstName.message}</p> : null}
          </div>
          <div>
            <label className="label" htmlFor="lastName">{t(locale, 'clientForm.lastName')}</label>
            <input id="lastName" className="input" {...register('lastName')} />
            {errors.lastName ? <p className="field-error">{errors.lastName.message}</p> : null}
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">{t(locale, 'clientForm.email')}</label>
          <input id="email" type="email" className="input" {...register('email')} />
          {errors.email ? <p className="field-error">{errors.email.message}</p> : null}
        </div>
        <div>
          <label className="label" htmlFor="phone">{t(locale, 'clientForm.phone')}</label>
          <input id="phone" className="input" {...register('phone')} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="ownerName">{t(locale, 'clientForm.owner')}</label>
        <input id="ownerName" className="input" {...register('ownerName')} />
        {errors.ownerName ? <p className="field-error">{errors.ownerName.message}</p> : null}
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
