'use client';

import { ErrorBoundaryView } from '@/components/ErrorBoundaryView';

export default function ClientsError(props: { error: Error; reset: () => void }) {
  return <ErrorBoundaryView {...props} />;
}
