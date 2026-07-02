import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useCategories } from '../contexts/CategoryContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import PlayerDetailsWidget from './widgets/PlayerDetailsWidget';
import styles from '../styles/components/PlayerList.module.css';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [filterTeamId, setFilterTeamId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 18;
  const isAdmin = !!getToken();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { categories, categoriesLoading } = useCategories();
  const { openPanel } = useRightPanel();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '', CategoryID: '', PhotoURL: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [playersData, teamsData] = await Promise.all([
          apiRequest(`/api/players?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/teams?seasonId=${selectedSeasonId}`)
        ]);
        setPlayers(Array.isArray(playersData) ? playersData : []);
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

  const openModal = (player = null) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({ 
        FirstName: player.FirstName || '', 
        LastName: player.LastName || '', 
        JerseyNumber: player.JerseyNumber || '', 
        Position: player.Position || '', 
        TeamID: player.TeamID || '',
        CategoryID: player.CategoryID || activeCategoryId || '',
        PhotoURL: player.PhotoURL || ''
      });
    } else {
      setEditingPlayer(null);
      setFormData({ FirstName: '', LastName: '', JerseyNumber: '', Position: '', TeamID: '', CategoryID: activeCategoryId || '', PhotoURL: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingPlayer) {
        const res = await apiRequest(`/api/players/${editingPlayer.PlayerID}`, {
          method: 'PUT',
          body: formData,
          auth: true
        });
        setPlayers(players.map(p => p.PlayerID === editingPlayer.PlayerID ? { ...p, ...res } : p));
      } else {
        const res = await apiRequest('/api/players', {
          method: 'POST',
          body: { ...formData, seasonId: selectedSeasonId },
          auth: true
        });
        setPlayers([...players, res]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Error al guardar el jugador.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este jugador?')) return;
    try {
      await apiRequest(`/api/players/${id}`, { method: 'DELETE', auth: true });
      setPlayers(players.filter(p => p.PlayerID !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar el jugador.');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Jugadores" 
        subtitle="Listado general de jugadores registrados" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nuevo Jugador</Button>}
      />
      <Alert message={error} />

      {/* Category Tabs & Filters */}
      {!categoriesLoading && categories.length > 0 && (
        <div className={styles.filtersContainer}>
          <div className={styles.tabsWrapper}>
            {categories.map(cat => (
              <button
                key={cat.CategoryID}
                onClick={() => {
                  setActiveCategoryId(cat.CategoryID);
                  setFilterTeamId('');
                  setCurrentPage(1);
                }}
                className={`${styles.tab} ${activeCategoryId === cat.CategoryID ? styles.tabActive : styles.tabInactive}`}
              >
                {cat.Name}
              </button>
            ))}
          </div>

          <div className={styles.selectWrapper}>
            <select 
              className={styles.select}
              value={filterTeamId}
              onChange={(e) => { setFilterTeamId(e.target.value); setCurrentPage(1); }}
            >
              <option value="">Todos los equipos</option>
              {teams.map(t => (
                <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading || categoriesLoading ? (
        <div className={styles.playerGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className={styles.skeletonCard}>
              <Skeleton className={styles.skeletonAvatar} />
              <div className={styles.skeletonInfo}>
                <Skeleton className={styles.skeletonText1} />
                <Skeleton className={styles.skeletonText2} />
              </div>
            </Card>
          ))}
        </div>
      ) : (() => {
        const filteredPlayers = players.filter(p => 
          String(p.CategoryID) === String(activeCategoryId) && 
          (filterTeamId === '' || String(p.TeamID) === String(filterTeamId))
        );

        if (filteredPlayers.length === 0) {
          return (
            <Card className={styles.emptyCard}>
               <div className={styles.emptyIcon}>⛹️‍♂️</div>
              <p className={styles.emptyText}>
                {filterTeamId ? 'No hay jugadores en este equipo para la categoría seleccionada.' : 'No hay jugadores cargados en esta categoría.'}
              </p>
            </Card>
          );
        }

        const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedPlayers = filteredPlayers.slice(startIndex, startIndex + itemsPerPage);

        return (
          <div className={styles.listContainer}>
            <div className={styles.playerGrid}>
              {paginatedPlayers.map((player) => {
              const nameParts = [player.FirstName, player.LastName].filter(Boolean);
              const displayName =
                nameParts.length > 0
                  ? nameParts.join(' ')
                  : player.PlayerName || player.Nombre || player.Name || 'Jugador';
  
              const teamObj = teams.find(t => String(t.TeamID) === String(player.TeamID));
              const teamName = teamObj ? (teamObj.TeamName || teamObj.Name || teamObj.Equipo) : null;
              const teamLogoURL = teamObj ? teamObj.LogoURL : null;

              return (
                <Card 
                  key={player.PlayerID} 
                  onClick={() => openPanel(<PlayerDetailsWidget player={{ ...player, TeamName: teamName, TeamLogoURL: teamLogoURL }} />)}
                  className={`${styles.playerCard} group`}
                >
                  {player.CategoryName && (
                    <div className={styles.playerGlow}></div>
                  )}
                  
                  {isAdmin && (
                    <div className={styles.playerActions}>
                      <button onClick={(e) => { e.stopPropagation(); openModal(player); }} className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>
                        ✏️
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(player.PlayerID); }} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>
                        🗑️
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.playerContent}>
                    <div className={styles.avatarContainer}>
                      <img 
                        src={player.PhotoURL || 'https://images.fifaindex.com/fifa22/players/205340.png'} 
                        alt={displayName} 
                        className={styles.avatarImg} 
                        onError={(e) => { e.target.src = 'https://images.fifaindex.com/fifa22/players/205340.png'; }}
                      />
                    </div>
                    <div className={styles.playerInfo}>
                      <p className={styles.playerName}>
                        {displayName}
                      </p>
                      <div className={styles.badgesContainer}>
                        {player.JerseyNumber && (
                          <span className={`${styles.badge} ${styles.badgeDefault}`}>
                            #{player.JerseyNumber}
                          </span>
                        )}
                        <span className={`${styles.badge} ${styles.badgeDefault} uppercase`}>
                          {player.Position || 'N/A'}
                        </span>
                        {teamName && (
                          <span className={`${styles.badge} ${styles.badgeTeam}`} title={teamName}>
                            {teamName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
            </div>
            
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className={styles.pageBtn}
                >
                  ← Anterior
                </Button>
                <div className={styles.pageInfo}>
                  <span className={styles.pageLabel}>Página</span>
                  <span className={styles.pageNumbers}>{currentPage} de {totalPages}</span>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  className={styles.pageBtn}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </div>
        );
      })()}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPlayer ? 'Editar Jugador' : 'Nuevo Jugador'}
      >
        <form onSubmit={handleSave} className={styles.form}>
          <Input 
            label="Nombre" 
            value={formData.FirstName} 
            onChange={e => setFormData({...formData, FirstName: e.target.value})} 
            required 
          />
          <Input 
            label="Apellido" 
            value={formData.LastName} 
            onChange={e => setFormData({...formData, LastName: e.target.value})} 
            required 
          />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Dorsal</label>
              <select 
                className={styles.formSelect}
                value={formData.JerseyNumber}
                onChange={e => setFormData({...formData, JerseyNumber: e.target.value})}
              >
                <option value="">N/A</option>
                {Array.from({length: 100}, (_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Posición</label>
              <select 
                className={styles.formSelect}
                value={formData.Position}
                onChange={e => setFormData({...formData, Position: e.target.value})}
              >
                <option value="">N/A</option>
                <option value="Base">Base</option>
                <option value="Escolta">Escolta</option>
                <option value="Alero">Alero</option>
                <option value="Ala-Pívot">Ala-Pívot</option>
                <option value="Pívot">Pívot</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Equipo</label>
            <select 
              className={styles.formSelect}
              value={formData.TeamID}
              onChange={e => setFormData({...formData, TeamID: e.target.value})}
              required
            >
              <option value="">Seleccione un equipo...</option>
              {teams.map(t => (
                <option key={t.TeamID} value={t.TeamID}>{t.TeamName || t.Name || t.Equipo}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Categoría</label>
            <select 
              className={styles.formSelect}
              value={formData.CategoryID}
              onChange={e => setFormData({...formData, CategoryID: e.target.value})}
              required
            >
              <option value="">Seleccione una categoría...</option>
              {categories.map(c => (
                <option key={c.CategoryID} value={c.CategoryID}>{c.Name}</option>
              ))}
            </select>
          </div>
          <Input 
            label="URL de Foto (Opcional)" 
            type="url"
            placeholder="https://images.fifaindex.com/fifa22/players/205340.png"
            value={formData.PhotoURL} 
            onChange={e => setFormData({...formData, PhotoURL: e.target.value})} 
          />
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

export default PlayerList;
