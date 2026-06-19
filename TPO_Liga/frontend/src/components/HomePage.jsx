import MatchList from './MatchList';

export default function HomePage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 shadow-inner flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Youth Basketball League
          </h1>
          <p className="text-zinc-400 mt-1">Explora los resultados y próximos partidos de la liga.</p>
        </div>
        <div className="text-5xl opacity-50">🏀</div>
      </div>
      
      <MatchList />
    </div>
  );
}
