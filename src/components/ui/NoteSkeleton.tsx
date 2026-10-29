interface NoteSkeletonProps {
  rows?: number;
}

export function NoteSkeleton({ rows = 3 }: NoteSkeletonProps) {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <li
          key={index}
          className="flex min-h-14 animate-pulse items-center gap-3 rounded-block border border-border bg-surface px-4 py-3"
        >
          <div className="h-3.5 flex-1 rounded-full bg-border" />
          <div className="size-6 rounded-full bg-border" />
        </li>
      ))}
    </ul>
  );
}
