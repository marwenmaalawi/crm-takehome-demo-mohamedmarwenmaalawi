'use client';

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-xl text-danger-text">
        !
      </div>
      <div className="text-base font-semibold text-slate-800">{title}</div>
      {message ? <p className="max-w-md text-sm text-slate-500">{message}</p> : null}
      {onRetry && retryLabel ? (
        <button onClick={onRetry} className="btn-secondary mt-2">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
