import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';

const MatchList = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  const { selectedSeasonId } = useSeason();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({ LocalTeamID: '', VisitorTeamID: '', MatchDate: '', LocalPoints: '', VisitorPoints: '', Status: '' });
  const [saving, setSaving] = useState(false);

  // View Match State
  const [viewingMatch, setViewingMatch] = useState(null);

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

  const openModal = (match = null) => {
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

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este partido?')) return;
    try {
      await apiRequest(`/api/matches/${id}`, { method: 'DELETE', auth: true });
      setMatches(matches.filter(m => m.MatchID !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar el partido.');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Partidos" 
        subtitle="Calendario y resultados de encuentros" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nuevo Partido</Button>}
      />
      <Alert message={error} />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24">
               <Skeleton className="h-8 w-full" />
            </Card>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4 opacity-50">📅</div>
          <p className="text-lg text-zinc-400">No hay partidos cargados.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => {
            const localTeam = match.HomeTeamName || match.Local || getTeamName(match.HomeTeamID) || getTeamName(match.LocalTeamID) || `Equipo ${match.HomeTeamID || match.LocalTeamID || 'Local'}`;
            const visitorTeam = match.AwayTeamName || match.Visitante || getTeamName(match.AwayTeamID) || getTeamName(match.VisitorTeamID) || `Equipo ${match.AwayTeamID || match.VisitorTeamID || 'Visitante'}`;
            const localScore = match.HomeScore ?? match.LocalPoints ?? match.HomePoints;
            const visitorScore = match.AwayScore ?? match.VisitorPoints ?? match.AwayPoints;
            
            // Format Date and Time
            const dateStr = match.MatchDate ? new Date(match.MatchDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';
            // Only show time if it's not a 1970 dummy date/time
            const timeStr = match.MatchTime && !match.MatchTime.startsWith('1970') && !match.MatchTime.startsWith('0001') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
            
            const hasScore = localScore !== null && localScore !== undefined;
            const localWon = hasScore && localScore > visitorScore;
            const visitorWon = hasScore && visitorScore > localScore;

            return (
              <Card 
                key={match.MatchID} 
                className="group hover:border-orange-500/40 transition-colors p-0 overflow-hidden relative cursor-pointer"
                onClick={() => setViewingMatch(match)}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-zinc-700 to-transparent group-hover:via-orange-500 transition-colors"></div>
                
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => { e.stopPropagation(); openModal(match); }} className="p-1 rounded bg-zinc-800/80 text-orange-400 hover:bg-zinc-700 hover:text-orange-300 transition-colors backdrop-blur-sm border border-zinc-700/50 text-xs">
                      ✏️
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(match.MatchID); }} className="p-1 rounded bg-zinc-800/80 text-red-500 hover:bg-zinc-700 hover:text-red-400 transition-colors backdrop-blur-sm border border-zinc-700/50 text-xs">
                      🗑️
                    </button>
                  </div>
                )}
                
                <div className="p-5">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-semibold px-2 py-1 bg-zinc-800 rounded text-zinc-400">Match #{match.MatchID}</span>
                    
                    {(dateStr || timeStr) && (
                      <span className="text-xs font-medium text-zinc-300 bg-zinc-900 px-2 py-1 rounded shadow-inner">
                        {dateStr} {timeStr && `• ${timeStr}`}
                      </span>
                    )}

                    <span className={`text-xs font-bold px-2 py-1 rounded ${hasScore ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                      {hasScore ? 'Finalizado' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Local Team */}
                    <div className="flex-1 text-center">
                      <p className={`font-bold text-lg leading-tight line-clamp-2 ${localWon ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {localTeam}
                      </p>
                      {hasScore && (
                        <p className={`text-3xl font-black mt-2 ${localWon ? 'text-orange-400' : 'text-zinc-500'}`}>
                          {localScore}
                        </p>
                      )}
                    </div>

                    {/* VS Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-10">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500 z-10 shadow-lg">
                        VS
                      </div>
                      {hasScore && <div className="h-full w-px bg-zinc-800 absolute top-0 bottom-0 -z-0"></div>}
                    </div>

                    {/* Visitor Team */}
                    <div className="flex-1 text-center">
                      <p className={`font-bold text-lg leading-tight line-clamp-2 ${visitorWon ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {visitorTeam}
                      </p>
                      {hasScore && (
                        <p className={`text-3xl font-black mt-2 ${visitorWon ? 'text-orange-400' : 'text-zinc-500'}`}>
                          {visitorScore}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
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

      {/* View Match Details Modal */}
      <Modal 
        isOpen={!!viewingMatch} 
        onClose={() => setViewingMatch(null)} 
        title={`Detalles del Partido #${viewingMatch?.MatchID}`}
      >
        {viewingMatch && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-zinc-800/50 p-6 rounded-xl border border-zinc-700/50 shadow-inner">
               <div className="text-center w-2/5">
                 <p className="font-bold text-zinc-100 text-lg leading-tight">{getTeamName(viewingMatch.LocalTeamID) || 'Local'}</p>
                 <p className="text-5xl font-black text-orange-400 mt-3 drop-shadow-md">{viewingMatch.LocalPoints ?? '-'}</p>
               </div>
               <div className="text-center w-1/5">
                 <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700/50">VS</span>
               </div>
               <div className="text-center w-2/5">
                 <p className="font-bold text-zinc-100 text-lg leading-tight">{getTeamName(viewingMatch.VisitorTeamID) || 'Visitante'}</p>
                 <p className="text-5xl font-black text-orange-400 mt-3 drop-shadow-md">{viewingMatch.VisitorPoints ?? '-'}</p>
               </div>
            </div>

            <div className="bg-zinc-800/30 rounded-xl p-5 border border-zinc-800/80 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                <span className="text-zinc-500 text-sm">Fecha</span>
                <span className="text-zinc-200 font-semibold">
                  {viewingMatch.MatchDate ? new Date(viewingMatch.MatchDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No asignada'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                <span className="text-zinc-500 text-sm">Hora</span>
                <span className="text-zinc-200 font-semibold">
                  {viewingMatch.MatchTime && !viewingMatch.MatchTime.startsWith('1970') && !viewingMatch.MatchTime.startsWith('0001') ? new Date(viewingMatch.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'No asignada'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800/50 pb-3">
                <span className="text-zinc-500 text-sm">Sede (Ubicación)</span>
                <span className="text-zinc-200 font-semibold">
                  {viewingMatch.Location || 'A confirmar'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-zinc-500 text-sm">Estado</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  viewingMatch.LocalPoints !== null && viewingMatch.LocalPoints !== undefined 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {viewingMatch.Status || (viewingMatch.LocalPoints !== null ? 'Finalizado' : 'Pendiente')}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setViewingMatch(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MatchList;
