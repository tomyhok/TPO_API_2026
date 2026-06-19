export default function Spinner({ className = '' }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500 ${className}`}
    />
  );
}
