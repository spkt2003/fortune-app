interface SealMarkProps {
  className?: string;
}

// The app's one signature visual element (frontend-design skill's "signature"
// concept) — a small red-and-gold stamp, like a chop mark on a fortune slip.
// print:hidden since printed output stays plain black-on-white.
export default function SealMark({ className = "" }: SealMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={`h-8 w-8 shrink-0 -rotate-6 print:hidden ${className}`}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18" fill="#8c1f1f" stroke="#c9a227" strokeWidth="2" />
      <path
        d="M13 20 Q20 10 27 20 Q20 30 13 20 Z"
        fill="none"
        stroke="#ede3d0"
        strokeWidth="1.5"
      />
    </svg>
  );
}
