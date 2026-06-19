export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-300 ml-1">{label}</label>}
      <input
        className={`w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-2.5 text-zinc-100 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-orange-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500/20 ${error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-rose-400 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
}
