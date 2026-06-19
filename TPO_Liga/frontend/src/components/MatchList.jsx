import { useEffect, useState, useMemo } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import Alert from './ui/Alert';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import MatchDetailsWidget from './widgets/MatchDetailsWidget';

const MatchList = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  const { selectedSeasonId } = useSeason();
  const { openPanel } = useRightPanel();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({ LocalTeamID: '', VisitorTeamID: '', MatchDate: '', LocalPoints: '', VisitorPoints: '', Status: '' });
  const [saving, setSaving] = useState(false);

  const getTeamName = (id) => {
    if (!id) return null;
    const t = teams.find(team => String(team.TeamID) === String(id) || String(team.id) === String(id));
    return t ? (t.TeamName || t.Equipo || t.Name) : null;
  };

  useEffect(() => {
    if (!selectedSeasonId) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [matchesData, teamsData] = await Promise.all([
          apiRequest(`/api/matches?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/teams?seasonId=${selectedSeasonId}`)
        ]);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeasonId]);

  const openMatchDetails = (match) => {
    openPanel(<MatchDetailsWidget match={match} getTeamName={getTeamName} />);
  };

  const openModal = (match = null, e = null) => {
    if (e) e.stopPropagation();
    if (match) {
      setEditingMatch(match);
      setFormData({ 
        LocalTeamID: match.LocalTeamID || '', 
        VisitorTeamID: match.VisitorTeamID || '', 
        MatchDate: match.MatchDate ? match.MatchDate.substring(0, 10) : '', 
        LocalPoints: match.LocalPoints ?? '', 
        VisitorPoints: match.VisitorPoints ?? '', 
        Status: match.Status || '' 
      });
    } else {
      setEditingMatch(null);
      setFormData({ LocalTeamID: '', VisitorTeamID: '', MatchDate: '', LocalPoints: '', VisitorPoints: '', Status: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    // Convert empty strings to null for points
    const payload = { ...formData };
    if (payload.LocalPoints === '') payload.LocalPoints = null;
    if (payload.VisitorPoints === '') payload.VisitorPoints = null;

    try {
      if (editingMatch) {
        const res = await apiRequest(`/api/matches/${editingMatch.MatchID}`, {
          method: 'PUT',
          body: payload,
          auth: true
        });
        setMatches(matches.map(m => m.MatchID === editingMatch.MatchID ? { ...m, ...res } : m));
      } else {
        const res = await apiRequest('/api/matches', {
          method: 'POST',
          body: { ...payload, seasonId: selectedSeasonId },
          auth: true
        });
        setMatches([...matches, res]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el partido.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar este partido?')) return;
    try {
      await apiRequest(`/api/matches/${id}`, { method: 'DELETE', auth: true });
      setMatches(matches.filter(m => m.MatchID !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar el partido.');
    }
  };

  // Group matches by date
  const groupedMatches = useMemo(() => {
    const groups = {};
    matches.forEach(match => {
      const dateKey = match.MatchDate 
        ? new Date(match.MatchDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
        : 'Sin fecha';
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(match);
    });
    
    // Sort groups (roughly) - assuming keys are parseable or we just return an array of entries
    return Object.entries(groups).sort((a, b) => {
        if (a[0] === 'Sin fecha') return 1;
        if (b[0] === 'Sin fecha') return -1;
        // Basic string sort is not perfect for dates but we trust the DB order mostly
        return 0;
    });
  }, [matches]);

  return (
    <div className="animate-fade-in w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Calendario de Partidos</h1>
            <p className="text-sm text-zinc-400">Resultados y próximos encuentros</p>
        </div>
        {isAdmin && <Button onClick={() => openModal()}>+ Nuevo Partido</Button>}
      </div>
      
      <Alert message={error} />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800">
          <div className="text-4xl mb-4 opacity-50">📅</div>
          <p className="text-lg text-zinc-400">No hay partidos cargados para esta temporada.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedMatches.map(([date, dayMatches]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 flex items-center gap-2">
                <span className="w-4 h-px bg-zinc-700"></span> {date} <span className="flex-1 h-px bg-zinc-800"></span>
              </h3>
              
              <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden divide-y divide-zinc-800/50">
                {dayMatches.map((match) => {
                  const localTeam = match.HomeTeamName || match.Local || getTeamName(match.HomeTeamID) || getTeamName(match.LocalTeamID) || `Equipo Local`;
                  const visitorTeam = match.AwayTeamName || match.Visitante || getTeamName(match.AwayTeamID) || getTeamName(match.VisitorTeamID) || `Equipo Visitante`;
                  const localScore = match.HomeScore ?? match.LocalPoints ?? match.HomePoints;
                  const visitorScore = match.AwayScore ?? match.VisitorPoints ?? match.AwayPoints;
                  
                  const timeStr = match.MatchTime && !match.MatchTime.startsWith('1970') && !match.MatchTime.startsWith('0001') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
                  
                  const hasScore = localScore !== null && localScore !== undefined;
                  const localWon = hasScore && localScore > visitorScore;
                  const visitorWon = hasScore && visitorScore > localScore;

                  return (
                    <div 
                      key={match.MatchID} 
                      className="group flex items-center p-3 hover:bg-zinc-800/50 transition-colors cursor-pointer relative"
                      onClick={() => openMatchDetails(match)}
                    >
                      {/* Left: Time / Status */}
                      <div className="w-16 flex-shrink-0 text-center pr-4 border-r border-zinc-800">
                        {hasScore ? (
                          <span className="text-xs font-bold text-zinc-500">FT</span>
                        ) : (
                          <span className="text-xs font-medium text-zinc-400">{timeStr}</span>
                        )}
                      </div>

                      {/* Center: Teams */}
                      <div className="flex-1 flex flex-col justify-center px-4 space-y-2 py-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">🛡️</div>
                                <span className={`text-sm font-medium ${localWon ? 'text-zinc-100 font-bold' : 'text-zinc-300'}`}>{localTeam}</span>
                            </div>
                            {hasScore && <span className={`text-sm font-bold ${localWon ? 'text-orange-400' : 'text-zinc-300'}`}>{localScore}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">🛡️</div>
                                <span className={`text-sm font-medium ${visitorWon ? 'text-zinc-100 font-bold' : 'text-zinc-300'}`}>{visitorTeam}</span>
                            </div>
                            {hasScore && <span className={`text-sm font-bold ${visitorWon ? 'text-orange-400' : 'text-zinc-300'}`}>{visitorScore}</span>}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => openModal(match, e)} className="p-1 rounded bg-zinc-800 text-orange-400 hover:bg-zinc-700 text-xs shadow">✏️</button>
                          <button onClick={(e) => handleDelete(match.MatchID, e)} className="p-1 rounded bg-zinc-800 text-red-500 hover:bg-zinc-700 text-xs shadow">🗑️</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMatch ? 'Editar Partido' : 'Nuevo Partido'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-300">Local</label>
              <select 
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={formData.LocalTeamID}
                onChange={e => setFormData({...formData, LocalTeamID: e.target.value})}
                required
              >
                <option value="">Seleccione...</option>
                {teams.map(t => (
                  <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-300">Visitante</label>
              <select 
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={formData.VisitorTeamID}
                onChange={e => setFormData({...formData, VisitorTeamID: e.target.value})}
                required
              >
                <option value="">Seleccione...</option>
                {teams.map(t => (
                  <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
                ))}
              </select>
            </div>
          </div>

          <Input 
            label="Fecha del Partido" 
            type="date"
            value={formData.MatchDate} 
            onChange={e => setFormData({...formData, MatchDate: e.target.value})} 
          />

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Puntos Local" 
              type="number"
              value={formData.LocalPoints} 
              onChange={e => setFormData({...formData, LocalPoints: e.target.value})} 
            />
            <Input 
              label="Puntos Visitante" 
              type="number"
              value={formData.VisitorPoints} 
              onChange={e => setFormData({...formData, VisitorPoints: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-zinc-300">Estado</label>
            <select 
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-zinc-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              value={formData.Status}
              onChange={e => setFormData({...formData, Status: e.target.value})}
            >
              <option value="">Por defecto</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MatchList;
