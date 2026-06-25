'use client';

import { ErrorBoundaryView } from '@/components/ErrorBoundaryView';

export default function DashboardError(props: { error: Error; reset: () => void }) {
  return <ErrorBoundaryView {...props} />;
}
