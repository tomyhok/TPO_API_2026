import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';
import { useCategories } from '../../contexts/CategoryContext';

const TeamDetailsWidget = ({ team }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedSeasonId } = useSeason();
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!team || !selectedSeasonId) return;

    const fetchTeam = async () => {
      setLoading(true);
      try {
        const data = await apiRequest(`/api/teams/${team.TeamID}?seasonId=${selectedSeasonId}`);
        setTeamData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [team, selectedSeasonId]);

  if (!team) return null;

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex items-center gap-4 border-b border-stone-200 pb-4">
        {(teamData?.LogoURL || team.LogoURL) ? (
          <img src={teamData?.LogoURL || team.LogoURL} alt={teamData?.TeamName || team.TeamName || team.Name || team.Equipo} className="w-14 h-14 rounded-xl object-contain bg-stone-200 border border-stone-300 shadow-lg" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-stone-200 flex items-center justify-center text-2xl shadow-lg border border-stone-300">🛡️</div>
        )}
        <div>
          <h3 className="font-bold text-xl text-stone-900 leading-tight">{teamData?.TeamName || team.TeamName || team.Name || team.Equipo}</h3>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teamData ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-100/30 rounded-xl p-4 border border-stone-200/50">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Entrenador</h4>
              <p className="font-semibold text-stone-800">{teamData.Coach || team.Coach || 'No asignado'}</p>
            </div>
            <div className="bg-stone-100/30 rounded-xl p-4 border border-stone-200/50">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Estadio</h4>
              <p className="font-semibold text-stone-800 text-sm leading-tight" title={teamData.StadiumName || team.StadiumName || 'No asignado'}>
                {teamData.StadiumName || team.StadiumName || 'No asignado'}
              </p>
            </div>
          </div>

          <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider mb-3">Plantel ({teamData.Players?.length || 0})</h4>
          
          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="flex border-b border-stone-200/80 overflow-x-auto no-scrollbar mb-4">
              {categories.map(cat => (
                <button
                  key={cat.CategoryID}
                  onClick={() => setActiveCategoryId(cat.CategoryID)}
                  className={`px-4 py-2 font-semibold text-xs whitespace-nowrap transition-all border-b-2 ${
                    activeCategoryId === cat.CategoryID 
                      ? 'border-orange-500 text-orange-400 bg-orange-500/5' 
                      : 'border-transparent text-stone-600 hover:text-stone-800 hover:bg-stone-200/30'
                  }`}
                >
                  {cat.Name}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {teamData.Players && teamData.Players.filter(p => p.CategoryID === activeCategoryId).length > 0 ? (
              <ul className="space-y-2">
                {teamData.Players.filter(p => p.CategoryID === activeCategoryId).map(p => (
                  <li key={p.PlayerID} className="flex justify-between items-center bg-stone-100/40 p-3 rounded-lg border border-stone-200/50 hover:bg-stone-200/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs">🧑‍🚀</div>
                      <span className="font-medium text-stone-800 text-sm">{p.FirstName} {p.LastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.Position && <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-600 font-bold uppercase">{p.Position}</span>}
                      {p.JerseyNumber && <span className="text-xs font-black text-orange-400 w-6 text-right">#{p.JerseyNumber}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-stone-500 text-sm italic bg-stone-100/30 p-4 rounded-lg text-center border border-stone-200/50">
                No hay jugadores registrados en esta categoría.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeamDetailsWidget;
