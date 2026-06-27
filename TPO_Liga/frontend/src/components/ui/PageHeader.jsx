export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">{title}</h1>
        {subtitle && <p className="text-base text-stone-600">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
