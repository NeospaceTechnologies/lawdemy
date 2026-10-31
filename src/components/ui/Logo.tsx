export function Logo({ instructor = false }: { instructor?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
        <path d="M2 2h6v16h12v6H5a3 3 0 0 1-3-3z" fill="#0B0B7E" />
        <circle cx="16" cy="12" r="4.5" fill="#F26B1D" />
      </svg>
      <span className="text-base font-bold text-primary">Lawdemy</span>
      {instructor && (
        <span className="ml-1 rounded bg-info-tint px-1.5 py-0.5 text-[10px] font-semibold text-info-text">Instructor</span>
      )}
    </span>
  );
}
