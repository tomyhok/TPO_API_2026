import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';

const MatchDetailsWidget = ({ match, getTeamName, getTeamLogo }) => {
  const [localTeamData, setLocalTeamData] = useState(null);
  const [visitorTeamData, setVisitorTeamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detalles'); // 'detalles' | 'alineaciones'
  
  const { selectedSeasonId } = useSeason();

  const localTeamId = match?.HomeTeamID || match?.LocalTeamID;
  const visitorTeamId = match?.AwayTeamID || match?.VisitorTeamID;
  const localTeamName = match?.HomeTeamName || match?.Local || getTeamName?.(localTeamId) || `Equipo Local`;
  const visitorTeamName = match?.AwayTeamName || match?.Visitante || getTeamName?.(visitorTeamId) || `Equipo Visitante`;
  
  const localLogo = getTeamLogo ? getTeamLogo(localTeamId) : null;
  const visitorLogo = getTeamLogo ? getTeamLogo(visitorTeamId) : null;

  const localScore = match.LocalPoints;
  const visitorScore = match.VisitorPoints;
  const hasScore = localScore !== null && localScore !== undefined;

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
      <h3 className="font-bold text-lg text-stone-900 mb-2 border-b border-stone-200 pb-2">Detalles del Partido</h3>
      
      {/* Header Scoreboard */}
      <div className="flex flex-col items-center justify-center p-4 bg-stone-100/50 rounded-xl border border-stone-200 shadow-inner flex-shrink-0">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex-1 text-center flex flex-col items-center min-w-0">
            {localLogo ? (
              <img src={localLogo} alt={localTeamName} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-contain bg-stone-200 border border-stone-300 shadow-lg mb-2" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-stone-200 flex items-center justify-center text-2xl shadow-lg border border-stone-300 mb-2">🛡️</div>
            )}
            <h4 className="font-bold text-stone-900 text-sm md:text-base leading-tight truncate w-full px-1" title={localTeamName}>{localTeamName}</h4>
            <span className="text-[10px] md:text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">Local</span>
          </div>
          
          <div className="px-2 flex flex-col items-center justify-center flex-shrink-0">
            {hasScore ? (
              <div className="text-3xl md:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-amber-600 whitespace-nowrap">
                {localScore} - {visitorScore}
              </div>
            ) : (
              <div className="text-2xl font-bold text-stone-400">VS</div>
            )}
            <span className="text-[10px] md:text-xs text-stone-500 font-medium uppercase mt-1">
              {match.Status || (hasScore ? 'Finalizado' : 'Pendiente')}
            </span>
          </div>

          <div className="flex-1 text-center flex flex-col items-center min-w-0">
            {visitorLogo ? (
              <img src={visitorLogo} alt={visitorTeamName} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl object-contain bg-stone-200 border border-stone-300 shadow-lg mb-2" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-stone-200 flex items-center justify-center text-2xl shadow-lg border border-stone-300 mb-2">🛡️</div>
            )}
            <h4 className="font-bold text-stone-900 text-sm md:text-base leading-tight truncate w-full px-1" title={visitorTeamName}>{visitorTeamName}</h4>
            <span className="text-[10px] md:text-xs font-semibold text-stone-500 uppercase tracking-widest mt-1">Visitante</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 flex-shrink-0">
        <button 
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'detalles' ? 'border-orange-500 text-orange-400' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
          onClick={() => setActiveTab('detalles')}
        >
          Detalles
        </button>
        <button 
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'alineaciones' ? 'border-orange-500 text-orange-400' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
          onClick={() => setActiveTab('alineaciones')}
        >
          Alineaciones
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {activeTab === 'detalles' ? (
          <div className="bg-stone-100/30 rounded-xl p-5 border border-stone-200/50 space-y-4">
            <h4 className="text-sm font-bold text-stone-600 uppercase tracking-wider mb-4">Información del Juego</h4>
            <div className="flex justify-between items-center border-b border-stone-200/50 pb-3">
              <span className="text-stone-500 text-sm">Fecha</span>
              <span className="text-stone-800 font-medium">
                {match.MatchDate ? new Date(match.MatchDate).toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : 'No asignada'}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200/50 pb-3">
              <span className="text-stone-500 text-sm">Hora</span>
              <span className="text-stone-800 font-medium">
                {match.MatchTime && !match.MatchTime.startsWith('1970') && !match.MatchTime.startsWith('0001') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No asignada'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 text-sm">Sede</span>
              <span className="text-stone-800 font-medium text-right max-w-[150px] truncate" title={match.Location || 'A confirmar'}>
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
                  <h4 className="text-sm font-bold text-stone-700 border-b border-stone-200 pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> {localTeamName}
                  </h4>
                  {localTeamData?.Players && localTeamData.Players.filter(p => p.CategoryID === match.CategoryID).length > 0 ? (
                    <ul className="space-y-1.5">
                      {localTeamData.Players.filter(p => p.CategoryID === match.CategoryID).map(p => (
                        <li key={p.PlayerID} className="flex justify-between items-center bg-stone-100/40 px-3 py-2 rounded-lg border border-stone-200/50">
                          <span className="font-medium text-stone-700 text-sm">{p.FirstName} {p.LastName}</span>
                          <div className="flex items-center gap-2">
                            {p.Position && <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-bold uppercase">{p.Position}</span>}
                            {p.JerseyNumber && <span className="text-xs font-black text-orange-500 w-5 text-right">#{p.JerseyNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500 italic p-3 bg-stone-100/20 rounded-lg text-center">Plantel no disponible</p>
                  )}
                </div>

                {/* Visitor Roster */}
                <div>
                  <h4 className="text-sm font-bold text-stone-700 border-b border-stone-200 pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> {visitorTeamName}
                  </h4>
                  {visitorTeamData?.Players && visitorTeamData.Players.filter(p => p.CategoryID === match.CategoryID).length > 0 ? (
                    <ul className="space-y-1.5">
                      {visitorTeamData.Players.filter(p => p.CategoryID === match.CategoryID).map(p => (
                        <li key={p.PlayerID} className="flex justify-between items-center bg-stone-100/40 px-3 py-2 rounded-lg border border-stone-200/50">
                          <span className="font-medium text-stone-700 text-sm">{p.FirstName} {p.LastName}</span>
                          <div className="flex items-center gap-2">
                            {p.Position && <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-500 font-bold uppercase">{p.Position}</span>}
                            {p.JerseyNumber && <span className="text-xs font-black text-amber-500 w-5 text-right">#{p.JerseyNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-stone-500 italic p-3 bg-stone-100/20 rounded-lg text-center">Plantel no disponible</p>
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
