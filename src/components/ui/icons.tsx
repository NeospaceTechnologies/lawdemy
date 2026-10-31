import type { SVGProps } from "react";

// Stroke icons used across the canvas. All are decorative (aria-hidden); give
// the surrounding button an aria-label.
type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, strokeWidth = 2, ...rest }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const PlusIcon = (p: P) => <Svg strokeWidth={2.4} {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const CloseIcon = (p: P) => <Svg size={12} strokeWidth={2.6} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const TrashIcon = (p: P) => <Svg size={14} {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Svg>;
export const EditIcon = (p: P) => <Svg size={14} {...p}><path d="M4 20h4L19 9l-4-4L4 16z" /></Svg>;
export const ChevronUpIcon = (p: P) => <Svg strokeWidth={2.4} {...p}><path d="M6 15l6-6 6 6" /></Svg>;
export const ChevronDownIcon = (p: P) => <Svg strokeWidth={2.4} {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const ChevronLeftIcon = (p: P) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const ChevronRightIcon = (p: P) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const UploadIcon = (p: P) => <Svg size={20} {...p}><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></Svg>;
export const SaveIcon = (p: P) => <Svg size={14} {...p}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></Svg>;
export const SearchIcon = (p: P) => <Svg size={15} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>;
export const ClockIcon = (p: P) => <Svg size={14} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const CheckIcon = (p: P) => <Svg size={14} strokeWidth={2.4} {...p}><path d="M5 12l5 5L20 7" /></Svg>;
export const CircleIcon = (p: P) => <Svg size={14} strokeWidth={2.4} {...p}><circle cx="12" cy="12" r="8" /></Svg>;
export const GripIcon = (p: P) => (
  <Svg size={14} {...p}>
    <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
  </Svg>
);
export const MenuIcon = (p: P) => <Svg size={20} {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
export const MailIcon = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Svg>;
export const EyeIcon = (p: P) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const EyeOffIcon = (p: P) => <Svg {...p}><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>;

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <Svg size={20} strokeWidth={1.8} fill={filled ? "currentColor" : "none"} {...p}><path d="M12 20s-7-4.4-9-9a4.5 4.5 0 0 1 9-3 4.5 4.5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></Svg>
);
export const CartIcon = (p: P) => <Svg size={20} strokeWidth={1.8} {...p}><path d="M3 4h2l2.5 11h11L21 7H6.2" /><circle cx="9" cy="19.5" r="1.5" /><circle cx="17" cy="19.5" r="1.5" /></Svg>;
export const BellIcon = (p: P) => <Svg size={20} strokeWidth={1.8} {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 21h4" /></Svg>;
export const LevelIcon = (p: P) => <Svg size={12} strokeWidth={2.4} {...p}><path d="M5 20v-4M12 20v-9M19 20V5" /></Svg>;
export const FilterIcon = (p: P) => <Svg size={14} {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Svg>;
export const SortIcon = (p: P) => <Svg size={14} {...p}><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></Svg>;
export const BookIcon = (p: P) => <Svg size={14} {...p}><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /></Svg>;
export const QuizIcon = (p: P) => <Svg size={14} {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></Svg>;
export const AwardIcon = (p: P) => <Svg size={14} {...p}><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></Svg>;
export const CalendarIcon = (p: P) => <Svg size={14} {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Svg>;
export const LockIcon = (p: P) => <Svg size={14} {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
export const ChatIcon = (p: P) => <Svg size={16} strokeWidth={1.8} {...p}><path d="M4 5h16v11H9l-5 4z" /></Svg>;
export const TimerIcon = (p: P) => <Svg size={16} {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></Svg>;
// The design's primary-button arrow: a white disc with a chevron in the button colour.
export function ContinueIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" className="flex-none">
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M6.5 5l3 3-3 3" stroke="var(--color-primary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export const BulbIcon = (p: P) => <Svg {...p}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></Svg>;
export const TrophyIcon = (p: P) => <Svg size={20} strokeWidth={1.8} {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6" /></Svg>;
export const PinIcon = (p: P) => <Svg {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>;
export const GlobeIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Svg>;
export const ArrowRightIcon = (p: P) => <Svg size={14} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const UpvoteIcon = (p: P) => <Svg size={14} {...p}><path d="M12 4l7 8h-4v8H9v-8H5z" /></Svg>;
export const MoreIcon = (p: P) => <Svg size={16} {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Svg>;
export const ImageIcon = (p: P) => <Svg size={16} {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></Svg>;
export const FileIcon = (p: P) => <Svg size={16} {...p}><path d="M6 2h8l6 6v14H6z" /><path d="M14 2v6h6" /></Svg>;
export const ExpandIcon = (p: P) => <Svg size={16} {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></Svg>;
export const ShareIcon = (p: P) => <Svg size={16} {...p}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></Svg>;
export const DownloadIcon = (p: P) => <Svg size={16} {...p}><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></Svg>;
export const LogoutIcon = (p: P) => <Svg size={16} {...p}><path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" /></Svg>;
export const SpinnerIcon = (p: P) => <Svg size={36} {...p}><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" /></Svg>;

/** Trending flame (filled orange). */
export function FlameIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="#F97316" aria-hidden="true">
      <path d="M12 22a7 7 0 0 0 7-7c0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8a7 7 0 0 0 7 7z" />
    </svg>
  );
}

/** Play triangle for video placeholders. */
export function PlayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#101828" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/** Toast success mark: white disc with a check. */
export function SuccessDiscIcon({ color = "#067647" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#ffffff" />
      <path d="M7.5 12l3 3 6-6" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Confirm dialog warning triangle. */
export function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3l10 18H2z" fill="#FDB022" />
      <path d="M12 10v5M12 18h.01" stroke="#7A2E0E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Sidebar nav icons (stroke 1.8)
const nav = (d: React.ReactNode) =>
  function NavIcon() {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {d}
      </svg>
    );
  };
export const NavDashboard = nav(<path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />);
export const NavCourses = nav(<><path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" /><path d="M8 9h6" /></>);
export const NavEarnings = nav(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h3" /></>);
export const NavCommunity = nav(<><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>);
export const NavSupport = nav(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />);
export const NavCertificates = nav(<><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></>);
export const NavSettings = nav(<><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>);
