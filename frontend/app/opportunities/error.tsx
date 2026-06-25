'use client';

import { ErrorBoundaryView } from '@/components/ErrorBoundaryView';

export default function OpportunitiesError(props: { error: Error; reset: () => void }) {
  return <ErrorBoundaryView {...props} />;
}
