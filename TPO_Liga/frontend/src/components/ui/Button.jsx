export default function Button({ type = 'button', variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 to-amber-600 text-zinc-100 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:from-orange-400 hover:to-amber-500 border border-orange-400/30',
    secondary: 'bg-zinc-800/80 backdrop-blur-sm text-orange-300 border border-orange-500/30 shadow-lg hover:shadow-orange-500/20 hover:bg-zinc-800 hover:text-orange-200',
    ghost: 'bg-transparent text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-zinc-100 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 border border-rose-400/30',
  };

  return (
    <button
      type={type}
      className={`rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    />
  );
}
