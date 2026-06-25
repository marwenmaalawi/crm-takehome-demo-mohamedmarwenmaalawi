'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiRequestError, deleteClient } from '@/lib/api';
import { t, type Locale } from '@/lib/i18n';

export function DeleteClientButton({ id, locale }: { id: string; locale: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!window.confirm(t(locale, 'clientDetail.confirmDelete'))) return;
    setBusy(true);
    try {
      await deleteClient(id);
      router.push('/clients');
      router.refresh();
    } catch (err) {
      // Most likely: 409 because the client still has opportunities.
      window.alert(err instanceof ApiRequestError ? err.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={onDelete} className="btn-danger" disabled={busy}>
      {t(locale, 'action.delete')}
    </button>
  );
}
