export function LinkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m10 13 4-4M8.5 15.5l-1 1a4 4 0 0 1-5.7-5.7l4-4a4 4 0 0 1 5.7 0M15.5 8.5l1-1a4 4 0 0 1 5.7 5.7l-4 4a4 4 0 0 1-5.7 0" />
    </svg>
  );
}
