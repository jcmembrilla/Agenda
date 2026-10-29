interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex animate-note-enter flex-col items-center justify-center px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="mb-4 grid size-11 place-items-center rounded-full border border-border bg-surface text-muted"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          className="size-5"
        >
          <path d="M5 12.5l4.4 4.4L19 7.4" />
        </svg>
      </div>
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="mt-1 max-w-[24ch] text-[13px] leading-snug text-muted">{description}</p>
    </div>
  );
}
