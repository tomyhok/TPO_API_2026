import { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';

const StandingsWidget = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeasonId } = useSeason();

  useEffect(() => {
    if (!selectedSeasonId) return;

    const fetchStandings = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/standings?seasonId=${selectedSeasonId}`);
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedSeasonId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-6"></div>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex gap-4">
            <div className="h-6 w-6 bg-zinc-800 rounded"></div>
            <div className="h-6 flex-1 bg-zinc-800 rounded"></div>
            <div className="h-6 w-8 bg-zinc-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (standings.length === 0) return null;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <h3 className="font-bold text-lg text-zinc-100 mb-4 border-b border-zinc-800 pb-2">Clasificación</h3>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 uppercase border-b border-zinc-800/50">
            <tr>
              <th className="py-2 font-medium w-8 text-center">#</th>
              <th className="py-2 font-medium">Equipo</th>
              <th className="py-2 font-medium text-right w-12">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {standings.map((team, index) => (
              <tr key={team.TeamID} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="py-2.5 text-center">
                  <span className={`text-xs font-bold ${
                    index < 3 ? 'text-orange-400' : 'text-zinc-500'
                  }`}>{index + 1}</span>
                </td>
                <td className="py-2.5 font-semibold text-zinc-300 group-hover:text-zinc-100 truncate max-w-[150px]">
                  {team.Equipo || team.TeamName}
                </td>
                <td className="py-2.5 text-right font-bold text-zinc-200">
                  {team.Puntos ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsWidget;
