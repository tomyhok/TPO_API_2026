export default function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="mb-1 block text-sm text-gray-300">{label}</label>}
      <input
        className={`w-full rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-gray-100 outline-none ring-indigo-400 transition focus:ring-2 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  );
}
