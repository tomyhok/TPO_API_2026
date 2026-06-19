import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';

const TeamDetailsWidget = ({ team }) => {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedSeasonId } = useSeason();

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
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl shadow-lg border border-zinc-700">🛡️</div>
        <div>
          <h3 className="font-bold text-xl text-zinc-100 leading-tight">{team.TeamName || team.Name || team.Equipo}</h3>
          <p className="text-sm text-zinc-500">ID: {team.TeamID}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teamData ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50 mb-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Entrenador</h4>
            <p className="font-semibold text-zinc-200">{teamData.Coach || 'No asignado'}</p>
          </div>

          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Plantel ({teamData.Players?.length || 0})</h4>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {teamData.Players && teamData.Players.length > 0 ? (
              <ul className="space-y-2">
                {teamData.Players.map(p => (
                  <li key={p.PlayerID} className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs">🧑‍🚀</div>
                      <span className="font-medium text-zinc-200 text-sm">{p.FirstName} {p.LastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.Position && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 font-bold uppercase">{p.Position}</span>}
                      {p.JerseyNumber && <span className="text-xs font-black text-orange-400 w-6 text-right">#{p.JerseyNumber}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-sm italic bg-zinc-900/30 p-4 rounded-lg text-center border border-zinc-800/50">
                No hay jugadores registrados en este equipo.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeamDetailsWidget;
