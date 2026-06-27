import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useCategories } from '../contexts/CategoryContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import TeamDetailsWidget from './widgets/TeamDetailsWidget';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { categories, categoriesLoading } = useCategories();
  const { openPanel } = useRightPanel();

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

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
  }, [selectedSeasonId, seasonLoading]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  const filteredStandings = standings.filter(s => s.CategoryID === activeCategoryId);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Tabla de Posiciones" subtitle="Clasificación general y rendimiento de equipos" />
      <Alert message={error} />

      <Card className="p-0 overflow-hidden border-0 bg-stone-100/40 backdrop-blur-md">
        {categoriesLoading || seasonLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className="flex border-b border-stone-200/80 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat.CategoryID}
                  onClick={() => setActiveCategoryId(cat.CategoryID)}
                  className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all border-b-2 ${
                    activeCategoryId === cat.CategoryID 
                      ? 'border-orange-500 text-orange-400 bg-orange-500/5' 
                      : 'border-transparent text-stone-600 hover:text-stone-800 hover:bg-stone-200/30'
                  }`}
                >
                  {cat.Name}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredStandings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-4 opacity-50">🏆</div>
                <p className="text-lg text-stone-600">No hay datos de posiciones para esta categoría.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm text-stone-700">
                  <thead className="bg-stone-200/80 text-xs uppercase text-stone-600 font-bold border-b border-stone-300/50 shadow-sm">
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
                  <tbody className="divide-y divide-stone-200/50">
                    {filteredStandings.map((team, index) => {
                  const isTop3 = index < 3;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                  
                  return (
                    <tr 
                      key={team.TeamID || index} 
                      onClick={() => openPanel(<TeamDetailsWidget team={{ TeamID: team.TeamID, TeamName: team.Equipo || team.TeamName }} />)}
                      className={`hover:bg-stone-200/50 transition-colors group cursor-pointer ${isTop3 ? 'bg-orange-500/[0.02]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold text-sm ${
                          index === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                          index === 1 ? 'bg-stone-300/60 text-stone-700 border border-stone-300' :
                          index === 2 ? 'bg-orange-700/20 text-orange-500 border border-orange-700/30' :
                          'bg-stone-200 text-stone-500'
                        }`}>
                          {medal ? <span className="text-lg">{medal}</span> : index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-base text-stone-900 group-hover:text-orange-300 transition-colors flex items-center gap-3">
                        {team.LogoURL ? (
                          <img src={team.LogoURL} alt={team.Equipo || team.TeamName} className="w-8 h-8 rounded-full object-contain bg-stone-200 border border-stone-300" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs shadow-inner border border-stone-300">🛡️</div>
                        )}
                        <span>{team.Equipo || team.TeamName || '-'}</span>
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
                          (team.DiferenciaDeTantos || 0) < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-stone-200 text-stone-600'
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
          </>
        )}
      </Card>
    </div>
  );
};

export default Standings;
