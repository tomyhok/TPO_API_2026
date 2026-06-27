import { useEffect, useState, useMemo } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useCategories } from '../contexts/CategoryContext';
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
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeRound, setActiveRound] = useState(1);
  const isAdmin = !!getToken();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { categories, categoriesLoading } = useCategories();
  const { openPanel } = useRightPanel();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [formData, setFormData] = useState({ LocalTeamID: '', VisitorTeamID: '', MatchDate: '', MatchTime: '', LocalPoints: '', VisitorPoints: '', Status: '', CategoryID: '', RoundNumber: '', Location: '' });
  const [saving, setSaving] = useState(false);

  const getTeamName = (id) => {
    if (!id) return null;
    const t = teams.find(team => String(team.TeamID) === String(id) || String(team.id) === String(id));
    return t ? (t.TeamName || t.Equipo || t.Name) : null;
  };

  const getTeamLogo = (id) => {
    if (!id) return null;
    const t = teams.find(team => String(team.TeamID) === String(id) || String(team.id) === String(id));
    return t ? t.LogoURL : null;
  };

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

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
  }, [selectedSeasonId, seasonLoading]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  const openMatchDetails = (match) => {
    openPanel(<MatchDetailsWidget match={match} getTeamName={getTeamName} getTeamLogo={getTeamLogo} />);
  };

  const openModal = (match = null, e = null) => {
    if (e) e.stopPropagation();
    if (match) {
      setEditingMatch(match);
      setFormData({ 
        LocalTeamID: match.LocalTeamID || '', 
        VisitorTeamID: match.VisitorTeamID || '', 
        MatchDate: match.MatchDate ? match.MatchDate.substring(0, 10) : '', 
        MatchTime: match.MatchTime && !match.MatchTime.startsWith('1970') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : '',
        LocalPoints: match.LocalPoints ?? '', 
        VisitorPoints: match.VisitorPoints ?? '', 
        Status: match.Status || '',
        CategoryID: match.CategoryID || activeCategoryId || '',
        RoundNumber: match.RoundNumber || activeRound || '',
        Location: match.Location || ''
      });
    } else {
      setEditingMatch(null);
      setFormData({ LocalTeamID: '', VisitorTeamID: '', MatchDate: '', MatchTime: '', LocalPoints: '', VisitorPoints: '', Status: '', CategoryID: activeCategoryId || '', RoundNumber: activeRound || '', Location: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (formData.LocalTeamID === formData.VisitorTeamID) {
      setError('El equipo local y el equipo visitante no pueden ser el mismo.');
      setSaving(false);
      return;
    }
    
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

  // Group matches by date and active round
  const groupedMatches = useMemo(() => {
    const groups = {};
    const filteredMatches = matches.filter(m => m.CategoryID === activeCategoryId && (m.RoundNumber === activeRound || (!m.RoundNumber && activeRound === 1)));
    filteredMatches.forEach(match => {
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
  }, [matches, activeCategoryId, activeRound]);

  const handlePrevRound = () => setActiveRound(prev => Math.max(1, prev - 1));
  const handleNextRound = () => setActiveRound(prev => Math.min(38, prev + 1));

  return (
    <div className="animate-fade-in w-full max-w-full">
      {/* Hero Header */}
      <div className="relative w-full rounded-3xl overflow-hidden mb-8 shadow-2xl group">
        <div className="absolute inset-0 bg-stone-900">
          <img src="/hero-bg.png" alt="Basketball Hero" className="w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/40 to-transparent"></div>
        </div>
        
        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-md mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">Temporada Oficial</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4">
              LIGA <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">JUVENIL</span>
            </h1>
            <p className="text-stone-300 text-sm md:text-base max-w-lg font-medium leading-relaxed">
              Sigue de cerca todos los resultados, las estadísticas al instante y el calendario completo de los próximos encuentros.
            </p>
          </div>
          
          {isAdmin && (
            <div className="flex-shrink-0">
              <Button 
                onClick={() => openModal()}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] border border-orange-400/50 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              >
                + Nuevo Partido
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Alert message={error} />

      {loading || categoriesLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <div className="flex border-b border-stone-200/80 overflow-x-auto no-scrollbar mb-6">
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

          {/* Round Selector */}
          <div className="flex items-center justify-between bg-stone-100/50 border border-stone-200/80 rounded-xl p-3 mb-6 shadow-sm">
            <Button variant="ghost" onClick={handlePrevRound} disabled={activeRound === 1} className="text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200">
              ← Anterior
            </Button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">Competición</span>
              <span className="text-xl font-black text-stone-800">Jornada {activeRound}</span>
            </div>
            <Button variant="ghost" onClick={handleNextRound} disabled={activeRound === 38} className="text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200">
              Siguiente →
            </Button>
          </div>

          {groupedMatches.length === 0 ? (
            <div className="text-center py-12 bg-stone-100/30 rounded-xl border border-stone-200">
              <div className="text-4xl mb-4 opacity-50">📅</div>
              <p className="text-lg text-stone-600">No hay partidos cargados para esta categoría.</p>
            </div>
          ) : (
        <div className="space-y-8">
          {groupedMatches.map(([date, dayMatches]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider px-2 flex items-center gap-2">
                <span className="w-4 h-px bg-stone-300"></span> {date} <span className="flex-1 h-px bg-stone-200"></span>
              </h3>
              
              <div className="bg-stone-100/40 border border-stone-200/50 rounded-xl overflow-hidden divide-y divide-stone-200/50">
                {dayMatches.map((match) => {
                  const localTeam = match.HomeTeamName || match.Local || getTeamName(match.HomeTeamID) || getTeamName(match.LocalTeamID) || `Equipo Local`;
                  const visitorTeam = match.AwayTeamName || match.Visitante || getTeamName(match.AwayTeamID) || getTeamName(match.VisitorTeamID) || `Equipo Visitante`;
                  const localScore = match.HomeScore ?? match.LocalPoints ?? match.HomePoints;
                  const visitorScore = match.AwayScore ?? match.VisitorPoints ?? match.AwayPoints;
                  
                  const timeStr = match.MatchTime && !match.MatchTime.startsWith('1970') && !match.MatchTime.startsWith('0001') ? new Date(match.MatchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '-';
                  const locationStr = match.Location || 'Sede sin definir';
                  
                  const hasScore = localScore !== null && localScore !== undefined;
                  const localWon = hasScore && localScore > visitorScore;
                  const visitorWon = hasScore && visitorScore > localScore;

                  return (
                    <div 
                      key={match.MatchID} 
                      className="group flex items-center p-3 hover:bg-stone-200/50 transition-colors cursor-pointer relative"
                      onClick={() => openMatchDetails(match)}
                    >
                      {/* Left: Time / Status */}
                      <div className="w-28 flex-shrink-0 text-center pr-4 border-r border-stone-200 flex flex-col justify-center items-center gap-1">
                        {hasScore ? (
                          <span className="text-xs font-bold text-stone-500 bg-stone-200/50 px-2 py-0.5 rounded">FINAL</span>
                        ) : (
                          <span className="text-sm font-bold text-stone-700">{timeStr}</span>
                        )}
                        <span className="text-[10px] text-stone-400 font-medium tracking-tight leading-tight text-center w-full px-1 line-clamp-2" title={locationStr}>
                          📍 {locationStr}
                        </span>
                      </div>

                      {/* Center: Teams */}
                      <div className="flex-1 flex flex-col justify-center px-4 space-y-2 py-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {getTeamLogo(match.HomeTeamID || match.LocalTeamID) ? (
                                  <img src={getTeamLogo(match.HomeTeamID || match.LocalTeamID)} alt={localTeam} className="w-5 h-5 rounded object-contain bg-stone-200" />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-stone-200 flex items-center justify-center text-[10px] text-stone-500">🛡️</div>
                                )}
                                <span className={`text-sm font-medium ${localWon ? 'text-stone-900 font-bold' : 'text-stone-700'}`}>{localTeam}</span>
                            </div>
                            {hasScore && <span className={`text-sm font-bold ${localWon ? 'text-orange-400' : 'text-stone-700'}`}>{localScore}</span>}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {getTeamLogo(match.AwayTeamID || match.VisitorTeamID) ? (
                                  <img src={getTeamLogo(match.AwayTeamID || match.VisitorTeamID)} alt={visitorTeam} className="w-5 h-5 rounded object-contain bg-stone-200" />
                                ) : (
                                  <div className="w-5 h-5 rounded bg-stone-200 flex items-center justify-center text-[10px] text-stone-500">🛡️</div>
                                )}
                                <span className={`text-sm font-medium ${visitorWon ? 'text-stone-900 font-bold' : 'text-stone-700'}`}>{visitorTeam}</span>
                            </div>
                            {hasScore && <span className={`text-sm font-bold ${visitorWon ? 'text-orange-400' : 'text-stone-700'}`}>{visitorScore}</span>}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => openModal(match, e)} className="p-1 rounded bg-stone-200 text-orange-400 hover:bg-stone-300 text-xs shadow">✏️</button>
                          <button onClick={(e) => handleDelete(match.MatchID, e)} className="p-1 rounded bg-stone-200 text-red-500 hover:bg-stone-300 text-xs shadow">🗑️</button>
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
        </>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMatch ? 'Editar Partido' : 'Nuevo Partido'}
      >
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium">{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Local</label>
              <select 
                className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={formData.LocalTeamID}
                onChange={e => {
                  const newLocalId = e.target.value;
                  const localTeam = teams.find(t => String(t.TeamID) === String(newLocalId));
                  setFormData({
                    ...formData, 
                    LocalTeamID: newLocalId,
                    Location: localTeam?.StadiumName || formData.Location || ''
                  });
                }}
                required
              >
                <option value="">Seleccione...</option>
                {teams.map(t => (
                  <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-stone-700">Visitante</label>
              <select 
                className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Fecha del Partido" 
              type="date"
              value={formData.MatchDate} 
              onChange={e => setFormData({...formData, MatchDate: e.target.value})} 
              required
            />
            <Input 
              label="Hora (Opcional)" 
              type="time"
              value={formData.MatchTime} 
              onChange={e => setFormData({...formData, MatchTime: e.target.value})} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-stone-700">Categoría</label>
            <select 
              className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              value={formData.CategoryID}
              onChange={e => setFormData({...formData, CategoryID: e.target.value})}
              required
            >
              <option value="">Seleccione...</option>
              {categories.map(c => (
                <option key={c.CategoryID} value={c.CategoryID}>{c.Name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Sede (Ubicación)" 
              value={formData.Location} 
              onChange={e => setFormData({...formData, Location: e.target.value})} 
            />
            <Input 
              label="Jornada (1-38)" 
              type="number"
              min="1"
              max="38"
              value={formData.RoundNumber} 
              onChange={e => setFormData({...formData, RoundNumber: e.target.value})} 
              required
            />
          </div>

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
            <label className="text-sm font-semibold text-stone-700">Estado</label>
            <select 
              className="w-full rounded-xl border border-stone-300 bg-stone-100/50 px-4 py-3 text-stone-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
