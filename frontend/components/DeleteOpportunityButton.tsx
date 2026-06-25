'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteOpportunity } from '@/lib/api';
import { t, type Locale } from '@/lib/i18n';

export function DeleteOpportunityButton({ id, locale }: { id: string; locale: Locale }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onDelete = async () => {
    if (!window.confirm(t(locale, 'detail.confirmDelete'))) return;
    setBusy(true);
    try {
      await deleteOpportunity(id);
      router.push('/opportunities');
      router.refresh();
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
