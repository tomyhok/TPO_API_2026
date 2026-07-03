import { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';
import { useCategories } from '../../contexts/CategoryContext';
import TeamLogo from '../ui/TeamLogo';

const StandingsWidget = ({ seasonId: propSeasonId, hideTitle = false }) => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeasonId } = useSeason();
  const effectiveSeasonId = propSeasonId || selectedSeasonId;
  const { categories, categoriesLoading } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  useEffect(() => {
    if (!effectiveSeasonId) return;

    const fetchStandings = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/standings?seasonId=${effectiveSeasonId}`);
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [effectiveSeasonId]);

  useEffect(() => {
    if (!activeCategoryId && categories && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  if (loading || categoriesLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-stone-200 rounded w-1/3 mb-6"></div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex gap-4">
            <div className="h-6 w-6 bg-stone-200 rounded"></div>
            <div className="h-6 flex-1 bg-stone-200 rounded"></div>
            <div className="h-6 w-8 bg-stone-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (standings.length === 0) return null;

  const filteredStandings = standings.filter(t => String(t.CategoryID) === String(activeCategoryId));

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-2 gap-4">
        {!hideTitle && <h3 className="font-bold text-lg text-stone-900">Clasificación</h3>}
        {categories && categories.length > 0 && (
          <select 
            className="bg-stone-100 border border-stone-300 text-stone-700 text-sm rounded-lg px-3 py-1.5 focus:border-orange-500/50 appearance-none max-w-[160px] shadow-sm cursor-pointer"
            value={activeCategoryId || ''}
            onChange={(e) => setActiveCategoryId(Number(e.target.value))}
          >
            {categories.map(c => (
              <option key={c.CategoryID} value={c.CategoryID}>{c.Name}</option>
            ))}
          </select>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-stone-500 uppercase border-b border-stone-200/50">
            <tr>
              <th className="py-2 font-medium w-8 text-center">#</th>
              <th className="py-2 font-medium">Equipo</th>
              <th className="py-2 font-medium text-right w-12">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/30">
            {filteredStandings.map((team, index) => (
              <tr key={team.TeamID} className="hover:bg-stone-200/30 transition-colors group">
                <td className="py-2.5 text-center">
                  <span className={`text-xs font-bold ${
                    index < 3 ? 'text-orange-400' : 'text-stone-500'
                  }`}>{index + 1}</span>
                </td>
                <td className="py-2.5 font-semibold text-stone-700 group-hover:text-stone-900 truncate max-w-[150px]" title={team.Equipo || team.TeamName}>
                  <div className="flex items-center gap-2">
                    <TeamLogo 
                      src={team.LogoURL} 
                      alt={team.Equipo || team.TeamName}
                      className="w-5 h-5 rounded-full"
                      fallbackClassName="w-5 h-5 rounded-full shadow-inner text-[10px]"
                    />
                    <span className="truncate">{team.Equipo || team.TeamName}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-bold text-stone-800">
                  {team.Puntos ?? '-'}
                </td>
              </tr>
            ))}
            {filteredStandings.length === 0 && (
              <tr>
                <td colSpan="3" className="py-8 text-center text-stone-500 text-sm">No hay equipos en esta categoría</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsWidget;
