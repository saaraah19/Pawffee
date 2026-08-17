export default function PawIcon({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="12" cy="15.2" rx="5.6" ry="4.6" />
      <ellipse cx="4.6" cy="9.4" rx="2.1" ry="2.6" transform="rotate(-18 4.6 9.4)" />
      <ellipse cx="9.4" cy="5.6" rx="2.1" ry="2.7" transform="rotate(-6 9.4 5.6)" />
      <ellipse cx="14.7" cy="5.6" rx="2.1" ry="2.7" transform="rotate(6 14.7 5.6)" />
      <ellipse cx="19.4" cy="9.4" rx="2.1" ry="2.6" transform="rotate(18 19.4 9.4)" />
    </svg>
  );
}
