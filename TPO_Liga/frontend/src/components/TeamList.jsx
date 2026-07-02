import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import TeamLogo from './ui/TeamLogo';
import TeamDetailsWidget from './widgets/TeamDetailsWidget';
import styles from '../styles/components/TeamList.module.css';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');
  const isAdmin = !!getToken();
  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { openPanel } = useRightPanel();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ Name: '', Coach: '', LogoURL: '', StadiumName: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

    const fetchTeams = async () => {
      setLoading(true);
      setPageError('');
      try {
        const data = await apiRequest(`/api/teams?seasonId=${selectedSeasonId}`);
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        setPageError(err.message || 'No se pudieron cargar los equipos.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [selectedSeasonId, seasonLoading]);

  const handleViewTeam = (team) => {
    openPanel(<TeamDetailsWidget team={team} />);
  };

  const openModal = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ Name: team.TeamName || team.Name || '', Coach: team.Coach || '', LogoURL: team.LogoURL || '', StadiumName: team.StadiumName || '' });
    } else {
      setEditingTeam(null);
      setFormData({ Name: '', Coach: '', LogoURL: '', StadiumName: '' });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingTeam) {
        const res = await apiRequest(`/api/teams/${editingTeam.TeamID}`, {
          method: 'PUT',
          body: formData,
          auth: true
        });
        setTeams(teams.map(t => t.TeamID === editingTeam.TeamID ? { ...t, ...res } : t));
      } else {
        const res = await apiRequest('/api/teams', {
          method: 'POST',
          body: { ...formData, seasonId: selectedSeasonId },
          auth: true
        });
        setTeams([...teams, res]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error al guardar el equipo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo?')) return;
    try {
      await apiRequest(`/api/teams/${id}`, { method: 'DELETE', auth: true });
      setTeams(teams.filter(t => t.TeamID !== id));
    } catch (err) {
      setPageError(err.message || 'Error al eliminar el equipo.');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Equipos" 
        subtitle="Listado de equipos registrados en la liga" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nuevo Equipo</Button>}
      />
      <Alert message={pageError} />

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className={styles.skeletonCard}>
              <Skeleton className={styles.skeletonText1} />
              <Skeleton className={styles.skeletonText2} />
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyIcon}>🛡️</div>
          <p className={styles.emptyText}>No hay equipos cargados actualmente.</p>
        </Card>
      ) : (
        <div className={styles.gridContainer}>
          {teams.map((team, idx) => {
            const teamName = team.TeamName || team.Equipo || team.Name || 'Equipo Sin Nombre';

            return (
              <Card 
                key={team.TeamID} 
                className={styles.teamCard}
                onClick={() => handleViewTeam(team)}
              >
                <div className={styles.teamCardBg}></div>
                
                <div className={styles.teamCardInner}>
                  <div className={styles.contentContainer}>
                    <TeamLogo 
                      src={team.LogoURL} 
                      alt={teamName}
                      className={styles.teamLogo}
                      fallbackClassName={styles.teamLogoFallback}
                    />
                    <div>
                      <h3 className={styles.teamName} title={teamName}>
                        {teamName}
                      </h3>
                      {team.Coach && (
                        <p className={styles.coachText}>
                          <span className={styles.coachLabel}>DT:</span> {team.Coach}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className={styles.teamCardActions}>
                      <button onClick={(e) => { e.stopPropagation(); openModal(team); }} className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>
                        Editar
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(team.TeamID); }} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
      >
        {formError && <div className={styles.errorAlert}>{formError}</div>}
        <form onSubmit={handleSave} className={styles.formContainer}>
          <Input 
            label="Nombre del Equipo" 
            value={formData.Name} 
            onChange={e => setFormData({...formData, Name: e.target.value})} 
            required 
          />
          <Input 
            label="Entrenador" 
            value={formData.Coach} 
            onChange={e => setFormData({...formData, Coach: e.target.value})} 
            required 
          />
          <Input 
            label="URL del Escudo (Opcional)" 
            type="url"
            placeholder="https://ejemplo.com/logo.png"
            value={formData.LogoURL} 
            onChange={e => setFormData({...formData, LogoURL: e.target.value})} 
          />
          <Input 
            label="Estadio Sede (Opcional)" 
            value={formData.StadiumName} 
            onChange={e => setFormData({...formData, StadiumName: e.target.value})} 
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

export default TeamList;
