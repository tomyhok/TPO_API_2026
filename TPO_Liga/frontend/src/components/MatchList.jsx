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
import TeamLogo from './ui/TeamLogo';
import MatchDetailsWidget from './widgets/MatchDetailsWidget';
import styles from '../styles/components/MatchList.module.css';

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
    const filteredMatches = matches.filter(m => String(m.CategoryID) === String(activeCategoryId) && (m.RoundNumber === activeRound || (!m.RoundNumber && activeRound === 1)));
    filteredMatches.forEach(match => {
      const dateKey = match.MatchDate 
        ? new Date(match.MatchDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
        : 'Sin fecha';
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(match);
    });
    
    return Object.entries(groups).sort((a, b) => {
        if (a[0] === 'Sin fecha') return 1;
        if (b[0] === 'Sin fecha') return -1;
        return 0;
    });
  }, [matches, activeCategoryId, activeRound]);

  const handlePrevRound = () => setActiveRound(prev => Math.max(1, prev - 1));
  const handleNextRound = () => setActiveRound(prev => Math.min(38, prev + 1));

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <div className={`${styles.hero} group`}>
        <div className={styles.heroBg}>
          <img src="/hero-bg.png" alt="Basketball Hero" className={styles.heroImg} />
          <div className={styles.heroOverlay1}></div>
          <div className={styles.heroOverlay2}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroTextWrapper}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot}></span>
              <span className={styles.heroBadgeText}>Temporada Oficial</span>
            </div>
            <h1 className={styles.heroTitle}>
              LIGA <span className={styles.heroTitleHighlight}>JUVENIL</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Sigue de cerca todos los resultados, las estadísticas al instante y el calendario completo de los próximos encuentros.
            </p>
          </div>
          
          {isAdmin && (
            <div className={styles.heroActions}>
              <Button 
                onClick={() => openModal()}
                className={styles.heroBtn}
              >
                + Nuevo Partido
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <Alert message={error} />

      {loading || categoriesLoading ? (
        <div className={styles.loadingWrapper}>
          <Skeleton className={styles.skeletonTitle} />
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={styles.skeletonRow} />
          ))}
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <div className={styles.tabsWrapper}>
            {categories.map(cat => (
              <button
                key={cat.CategoryID}
                onClick={() => setActiveCategoryId(cat.CategoryID)}
                className={`${styles.tab} ${activeCategoryId === cat.CategoryID ? styles.tabActive : styles.tabInactive}`}
              >
                {cat.Name}
              </button>
            ))}
          </div>

          {/* Round Selector */}
          <div className={styles.roundSelector}>
            <Button variant="ghost" onClick={handlePrevRound} disabled={activeRound === 1} className={styles.roundBtn}>
              ← Anterior
            </Button>
            <div className={styles.roundInfo}>
              <span className={styles.roundLabel}>Competición</span>
              <span className={styles.roundValue}>Jornada {activeRound}</span>
            </div>
            <Button variant="ghost" onClick={handleNextRound} disabled={activeRound === 38} className={styles.roundBtn}>
              Siguiente →
            </Button>
          </div>

          {groupedMatches.length === 0 ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIcon}>📅</div>
              <p className={styles.emptyText}>No hay partidos cargados para esta categoría.</p>
            </div>
          ) : (
        <div className={styles.listContainer}>
          {groupedMatches.map(([date, dayMatches]) => (
            <div key={date} className={styles.dayGroup}>
              <h3 className={styles.dayHeader}>
                <span className={styles.dayLineLeft}></span> {date} <span className={styles.dayLineRight}></span>
              </h3>
              
              <div className={styles.matchList}>
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
                      className={`${styles.matchRow} group`}
                      onClick={() => openMatchDetails(match)}
                    >
                      {/* Left: Time / Status */}
                      <div className={styles.matchLeft}>
                        {hasScore ? (
                          <span className={styles.matchStatusFinal}>FINAL</span>
                        ) : (
                          <span className={styles.matchTime}>{timeStr}</span>
                        )}
                        <span className={styles.matchLocation} title={locationStr}>
                          📍 {locationStr}
                        </span>
                      </div>

                      {/* Center: Teams */}
                      <div className={styles.matchCenter}>
                        <div className={styles.teamRow}>
                            <div className={styles.teamInfo}>
                                <TeamLogo 
                                  src={getTeamLogo(match.HomeTeamID || match.LocalTeamID)} 
                                  alt={localTeam}
                                  className={styles.teamLogo}
                                  fallbackClassName={styles.teamLogoFallback}
                                />
                                <span className={`${styles.teamName} ${localWon ? styles.teamNameWon : styles.teamNameLost}`}>{localTeam}</span>
                            </div>
                            {hasScore && <span className={`${styles.teamScore} ${localWon ? styles.teamScoreWon : styles.teamScoreLost}`}>{localScore}</span>}
                        </div>
                        <div className={styles.teamRow}>
                            <div className={styles.teamInfo}>
                                <TeamLogo 
                                  src={getTeamLogo(match.AwayTeamID || match.VisitorTeamID)} 
                                  alt={visitorTeam}
                                  className={styles.teamLogo}
                                  fallbackClassName={styles.teamLogoFallback}
                                />
                                <span className={`${styles.teamName} ${visitorWon ? styles.teamNameWon : styles.teamNameLost}`}>{visitorTeam}</span>
                            </div>
                            {hasScore && <span className={`${styles.teamScore} ${visitorWon ? styles.teamScoreWon : styles.teamScoreLost}`}>{visitorScore}</span>}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className={styles.matchActions}>
                          <button onClick={(e) => openModal(match, e)} className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>✏️</button>
                          <button onClick={(e) => handleDelete(match.MatchID, e)} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>🗑️</button>
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
        {error && <div className={styles.errorAlert}>{error}</div>}
        <form onSubmit={handleSave} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Local</label>
              <select 
                className={styles.formSelect}
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
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Visitante</label>
              <select 
                className={styles.formSelect}
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

          <div className={styles.formRow}>
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Categoría</label>
            <select 
              className={styles.formSelect}
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

          <div className={styles.formRow}>
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

          <div className={styles.formRow}>
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

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Estado</label>
            <select 
              className={styles.formSelect}
              value={formData.Status}
              onChange={e => setFormData({...formData, Status: e.target.value})}
            >
              <option value="">Por defecto</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Finalizado">Finalizado</option>
            </select>
          </div>

          <div className={styles.formActions}>
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
