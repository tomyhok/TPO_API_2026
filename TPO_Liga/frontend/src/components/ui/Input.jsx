export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-stone-700 ml-1">{label}</label>}
      <input
        className={`w-full rounded-xl border border-stone-300/50 bg-stone-100/50 px-4 py-2.5 text-stone-900 outline-none transition-all duration-300 placeholder:text-stone-500 focus:border-orange-500/50 focus:bg-stone-100 focus:ring-2 focus:ring-orange-500/20 ${error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-rose-400 ml-1 animate-fade-in">{error}</p>}
    </div>
  );
}
