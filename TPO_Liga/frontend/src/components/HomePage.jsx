import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Alert from './ui/Alert';
import Skeleton from './ui/Skeleton';

export default function HomePage() {
  const [data, setData] = useState({ teams: [], players: [], matches: [], standings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  const { selectedSeasonId } = useSeason();

  useEffect(() => {
    if (!selectedSeasonId) return;
    
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [teams, players, matches, standings] = await Promise.all([
          apiRequest(`/api/teams?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/players?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/matches?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/standings?seasonId=${selectedSeasonId}`),
        ]);

        setData({
          teams: Array.isArray(teams) ? teams : [],
          players: Array.isArray(players) ? players : [],
          matches: Array.isArray(matches) ? matches : [],
          standings: Array.isArray(standings) ? standings : [],
        });
      } catch (err) {
        setError(err.message || 'No se pudo cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedSeasonId]);

  const counts = {
    teams: data.teams.length,
    players: data.players.length,
    matches: data.matches.length,
    standings: data.standings.length,
  };

  const cards = [
    { title: 'Equipos', value: counts.teams, to: '/teams', color: 'from-red-500 to-yellow-400', icon: '🛡️' },
    { title: 'Jugadores', value: counts.players, to: '/players', color: 'from-amber-500 to-orange-500', icon: '⛹️' },
    { title: 'Partidos', value: counts.matches, to: '/matches', color: 'from-orange-600 to-amber-500', icon: '📅' },
    { title: 'Posiciones', value: counts.standings, to: '/standings', color: 'from-orange-500 to-amber-400', icon: '🏆' },
  ];

  // Derived data for widgets
  const topTeams = data.standings.slice(0, 3);
  const recentMatches = data.matches
    .filter(m => m.HomeScore !== undefined || m.LocalPoints !== undefined || m.HomePoints !== undefined)
    .slice(-4)
    .reverse();

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-900 via-amber-900 to-zinc-900 p-8 sm:p-10 shadow-2xl border border-orange-500/20">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500/30 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/30 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 mb-2 tracking-tight">
              {isAdmin ? 'Bienvenido al YBL Admin' : 'Bienvenido a YBL'}
            </h1>
            <p className="text-orange-200 text-lg max-w-xl leading-relaxed">
              {isAdmin 
                ? 'El panel de control definitivo para gestionar tu liga de baloncesto. Revisa las estadísticas en tiempo real y administra equipos y jugadores.' 
                : 'Explora todas las estadísticas en tiempo real de tu liga de baloncesto. Revisa la tabla de posiciones, los próximos partidos y el plantel de cada equipo.'}
            </p>
          </div>
          <div className="hidden lg:block text-7xl opacity-80 animate-pulse-slow">🏀</div>
        </div>
      </div>

      {error && <Alert message={error} />}

      {/* Main Stats */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden group hover:-translate-y-2 transition-all duration-300">
            <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`}></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="space-y-4">
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{card.title}</p>
                <div className="flex-1">
                  {loading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <p className="text-4xl font-black text-zinc-100 tracking-tight">{card.value}</p>
                  )}
                </div>
              </div>
              <div className="text-4xl opacity-80 drop-shadow-lg">{card.icon}</div>
            </div>
            
            <div className="relative z-10 mt-6 pt-4 border-t border-zinc-700/50">
              <NavLink 
                className="inline-flex items-center text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors" 
                to={card.to}
              >
                {isAdmin ? 'Gestionar' : 'Ver'} {card.title.toLowerCase()} <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </NavLink>
            </div>
          </Card>
        ))}
      </div>

      {/* Widgets Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Teams Widget */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-amber-400">🏆</span> Top 3 Equipos
            </h2>
            <NavLink to="/standings" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
              Ver tabla completa
            </NavLink>
          </div>
          
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : topTeams.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Aún no hay datos de posiciones.
              </div>
            ) : (
              <div className="space-y-4">
                {topTeams.map((team, index) => {
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                  const bg = index === 0 ? 'bg-amber-500/10 border-amber-500/20' : index === 1 ? 'bg-zinc-400/10 border-zinc-400/20' : 'bg-orange-700/10 border-orange-700/20';
                  
                  return (
                    <div key={team.TeamID || index} className={`flex items-center justify-between p-4 rounded-xl border ${bg}`}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl drop-shadow-md">{medal}</span>
                        <div>
                          <p className="font-bold text-zinc-100">{team.Equipo || team.TeamName}</p>
                          <p className="text-sm text-zinc-400">{team.PartidosGanados} Victorias - {team.PartidosPerdidos} Derrotas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-2xl text-zinc-100">{team.Puntos}</p>
                        <p className="text-xs text-zinc-500 font-bold uppercase">Pts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recent Matches Widget */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="text-orange-500">🔥</span> Partidos Recientes
            </h2>
            <NavLink to="/matches" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
              Ver calendario
            </NavLink>
          </div>
          
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Aún no hay resultados registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match) => {
                  const localScore = match.HomeScore ?? match.LocalPoints ?? match.HomePoints ?? 0;
                  const visitorScore = match.AwayScore ?? match.VisitorPoints ?? match.AwayPoints ?? 0;
                  const getTeamName = (id) => {
                    if (!id) return null;
                    const t = data.teams.find(team => String(team.TeamID) === String(id) || String(team.id) === String(id));
                    return t ? (t.TeamName || t.Equipo || t.Name) : null;
                  };

                  const localName = match.HomeTeamName || match.Local || getTeamName(match.HomeTeamID) || getTeamName(match.LocalTeamID) || `Equipo ${match.HomeTeamID || match.LocalTeamID || 'Local'}`;
                  const visitorName = match.AwayTeamName || match.Visitante || getTeamName(match.AwayTeamID) || getTeamName(match.VisitorTeamID) || `Equipo ${match.AwayTeamID || match.VisitorTeamID || 'Visitante'}`;

                  return (
                    <div key={match.MatchID} className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-700/50">
                      {/* Local */}
                      <div className="flex-1 text-right">
                        <p className={`font-bold ${localScore > visitorScore ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {localName}
                        </p>
                      </div>
                      
                      {/* Score */}
                      <div className="mx-6 flex items-center gap-3">
                        <span className={`text-xl font-black ${localScore > visitorScore ? 'text-orange-400' : 'text-zinc-300'}`}>
                          {localScore}
                        </span>
                        <span className="text-xs text-zinc-600 font-bold px-2 py-1 bg-zinc-900 rounded">VS</span>
                        <span className={`text-xl font-black ${visitorScore > localScore ? 'text-orange-400' : 'text-zinc-300'}`}>
                          {visitorScore}
                        </span>
                      </div>

                      {/* Visitor */}
                      <div className="flex-1 text-left">
                        <p className={`font-bold ${visitorScore > localScore ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {visitorName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
