export default function Alert({ message, tone = 'error' }) {
  const tones = {
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  };

  if (!message) return null;

  return <div className={`rounded-lg border p-3 text-sm ${tones[tone]}`}>{message}</div>;
}
