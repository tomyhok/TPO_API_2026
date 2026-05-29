export default function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-500 ${className}`}
      aria-label="loading"
    />
  );
}
