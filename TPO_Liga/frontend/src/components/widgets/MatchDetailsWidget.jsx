import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';

const MatchDetailsWidget = ({ match, getTeamName }) => {
  const [localTeamData, setLocalTeamData] = useState(null);
  const [visitorTeamData, setVisitorTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detalles'); // 'detalles' | 'alineaciones'
  
  const { selectedSeasonId } = useSeason();

  const localTeamId = match?.HomeTeamID || match?.LocalTeamID;
  const visitorTeamId = match?.AwayTeamID || match?.VisitorTeamID;
  const localTeamName = match?.HomeTeamName || match?.Local || getTeamName?.(localTeamId) || `Equipo Local`;
  const visitorTeamName = match?.AwayTeamName || match?.Visitante || getTeamName?.(visitorTeamId) || `Equipo Visitante`;

  useEffect(() => {
    if (!match || !selectedSeasonId) return;

    const fetchTeamsData = async () => {
      setLoading(true);
      try {
        const [localData, visitorData] = await Promise.all([
          localTeamId ? apiRequest(`/api/teams/${localTeamId}?seasonId=${selectedSeasonId}`) : Promise.resolve(null),
          visitorTeamId ? apiRequest(`/api/teams/${visitorTeamId}?seasonId=${selectedSeasonId}`) : Promise.resolve(null)
        ]);
        setLocalTeamData(localData);
        setVisitorTeamData(visitorData);
      } catch (err) {
        console.error("Error fetching rosters:", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'alineaciones' && !localTeamData && !visitorTeamData) {
      fetchTeamsData();
    }
  }, [match, selectedSeasonId, activeTab, localTeamId, visitorTeamId, localTeamData, visitorTeamData]);

  if (!match) return null;

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <h3 className="font-bold text-lg text-zinc-100 mb-2 border-b border-zinc-800 pb-2">Detalles del Partido</h3>
      
      {/* Header Scoreboard */}
      <div className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-inner flex-shrink-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-center flex-1">
            <div className="w-14 h-14 rounded-full bg-zinc-800 mb-3 flex items-center justify-center text-xl shadow-lg border border-zinc-700/50">🛡️</div>
            <p className="font-bold text-zinc-100 text-center text-sm leading-tight">{localTeamName}</p>
          </div>
          
          <div className="flex flex-col items-center justify-center px-4">
            {match.LocalPoints !== null && match.LocalPoints !== undefined ? (
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black ${match.LocalPoints > match.VisitorPoints ? 'text-orange-400' : 'text-zinc-100'}`}>{match.LocalPoints}</span>
                <span className="text-zinc-600 font-bold">-</span>
                <span className={`text-4xl font-black ${match.VisitorPoints > match.LocalPoints ? 'text-orange-400' : 'text-zinc-100'}`}>{match.VisitorPoints}</span>
              </div>
            ) : (
              <div className="text-zinc-500 font-bold text-xl px-4 py-2 bg-zinc-800 rounded-lg">VS</div>
            )}
            <span className="text-xs text-zinc-500 font-medium uppercase mt-2">
              {match.Status || (match.LocalPoints !== null ? 'Finalizado' : 'Pendiente')}
            </span>
          </div>

          <div className="flex flex-col items-center flex-1">
            <div className="w-14 h-14 rounded-full bg-zinc-800 mb-3 flex items-center justify-center text-xl shadow-lg border border-zinc-700/50">🛡️</div>
            <p className="font-bold text-zinc-100 text-center text-sm leading-tight">{visitorTeamName}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 flex-shrink-0">
        <button 
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'detalles' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('detalles')}
        >
          Detalles
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'alineaciones' ? 'border-orange-500 text-orange-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
          onClick={() => setActiveTab('alineaciones')}
        >
          Alineaciones
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {activeTab === 'detalles' ? (
          <div className="bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50 space-y-4">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Información del Juego</h4>
            <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
              <span className="text-zinc-500 text-sm">Fecha</span>
              <span className="text-zinc-200 font-medium">
                {match.MatchDate ? new Date(match.MatchDate).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'No asignada'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
              <span className="text-zinc-500 text-sm">Hora</span>
              <span className="text-zinc-200 font-medium">
                {match.MatchTime && !match.MatchTime.startsWith('1970') && !match.MatchTime.startsWith('0001') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No asignada'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 text-sm">Sede</span>
              <span className="text-zinc-200 font-medium text-right max-w-[150px] truncate" title={match.Location || 'A confirmar'}>
                {match.Location || 'A confirmar'}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                {/* Local Roster */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> {localTeamName}
                  </h4>
                  {localTeamData?.Players && localTeamData.Players.length > 0 ? (
                    <ul className="space-y-1.5">
                      {localTeamData.Players.map(p => (
                        <li key={p.PlayerID} className="flex justify-between items-center bg-zinc-900/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                          <span className="font-medium text-zinc-300 text-sm">{p.FirstName} {p.LastName}</span>
                          <div className="flex items-center gap-2">
                            {p.Position && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">{p.Position}</span>}
                            {p.JerseyNumber && <span className="text-xs font-black text-orange-500 w-5 text-right">#{p.JerseyNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900/20 rounded-lg text-center">Plantel no disponible</p>
                  )}
                </div>

                {/* Visitor Roster */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> {visitorTeamName}
                  </h4>
                  {visitorTeamData?.Players && visitorTeamData.Players.length > 0 ? (
                    <ul className="space-y-1.5">
                      {visitorTeamData.Players.map(p => (
                        <li key={p.PlayerID} className="flex justify-between items-center bg-zinc-900/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                          <span className="font-medium text-zinc-300 text-sm">{p.FirstName} {p.LastName}</span>
                          <div className="flex items-center gap-2">
                            {p.Position && <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-bold uppercase">{p.Position}</span>}
                            {p.JerseyNumber && <span className="text-xs font-black text-amber-500 w-5 text-right">#{p.JerseyNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-500 italic p-3 bg-zinc-900/20 rounded-lg text-center">Plantel no disponible</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchDetailsWidget;
