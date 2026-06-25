'use client';

import { ErrorBoundaryView } from '@/components/ErrorBoundaryView';

export default function OpportunityDetailError(props: { error: Error; reset: () => void }) {
  return <ErrorBoundaryView {...props} />;
}
