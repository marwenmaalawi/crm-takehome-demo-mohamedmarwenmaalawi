'use client';

import { ErrorBoundaryView } from '@/components/ErrorBoundaryView';

export default function PipelineError(props: { error: Error; reset: () => void }) {
  return <ErrorBoundaryView {...props} />;
}
