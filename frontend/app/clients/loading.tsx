import { Skeleton } from '@/components/Skeleton';

export default function ClientsLoading() {
  return (
    <>
      <Skeleton className="h-8 w-40" />
      <div className="mt-6 card mb-4 h-20 w-full" />
      <div className="card divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        ))}
      </div>
    </>
  );
}
