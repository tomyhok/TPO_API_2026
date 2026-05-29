export default function Button({ type = 'button', variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-indigo-500/30 border-indigo-400/50 text-indigo-100 hover:bg-indigo-500/45',
    ghost: 'bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-gray-700/60',
    danger: 'bg-red-500/20 border-red-400/40 text-red-100 hover:bg-red-500/30',
  };

  return (
    <button
      type={type}
      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
