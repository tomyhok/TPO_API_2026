import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { selectedSeasonId } = useSeason();

  useEffect(() => {
    if (!selectedSeasonId) return;

    const fetchStandings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/api/standings?seasonId=${selectedSeasonId}`);
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la tabla.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedSeasonId]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tabla de Posiciones" subtitle="Clasificación general y rendimiento de equipos" />
      <Alert message={error} />

      <Card className="p-0 overflow-hidden border-0 bg-zinc-900/40 backdrop-blur-md">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : standings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4 opacity-50">🏆</div>
            <p className="text-lg text-zinc-400">No hay datos de posiciones.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm text-zinc-300">
              <thead className="bg-zinc-800/80 text-xs uppercase text-zinc-400 font-bold border-b border-zinc-700/50 shadow-sm">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">Pos</th>
                  <th className="px-6 py-4">Equipo</th>
                  <th className="px-4 py-4 text-center">Pts</th>
                  <th className="px-4 py-4 text-center">PJ</th>
                  <th className="px-4 py-4 text-center text-emerald-400/80">PG</th>
                  <th className="px-4 py-4 text-center text-rose-400/80">PP</th>
                  <th className="px-4 py-4 text-center">Dif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {standings.map((team, index) => {
                  const isTop3 = index < 3;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                  
                  return (
                    <tr 
                      key={team.TeamID || index} 
                      className={`hover:bg-zinc-800/50 transition-colors group ${isTop3 ? 'bg-orange-500/[0.02]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' :
                          index === 1 ? 'bg-zinc-400/20 text-zinc-300 border border-zinc-400/30' :
                          index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {medal ? <span className="text-lg">{medal}</span> : index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-base text-zinc-100 group-hover:text-orange-300 transition-colors">
                        {team.Equipo || team.TeamName || '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-black text-lg text-orange-400">
                        {team.Puntos ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        {team.PartidosJugados ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-emerald-400">
                        {team.PartidosGanados ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-rose-400">
                        {team.PartidosPerdidos ?? '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-medium">
                        <span className={`px-2 py-1 rounded ${
                          (team.DiferenciaDeTantos || 0) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 
                          (team.DiferenciaDeTantos || 0) < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {(team.DiferenciaDeTantos > 0 ? '+' : '')}{team.DiferenciaDeTantos ?? '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Standings;
