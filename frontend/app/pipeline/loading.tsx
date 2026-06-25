import { Skeleton } from '@/components/Skeleton';

export default function PipelineLoading() {
  return (
    <>
      <Skeleton className="h-8 w-40" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-slate-100/70 p-3">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
