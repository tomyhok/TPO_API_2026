import { useEffect, useState } from 'react';
import { apiRequest, getToken } from '../services/api';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { useSeason } from '../contexts/SeasonContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import StandingsWidget from './widgets/StandingsWidget';
import styles from '../styles/components/SeasonList.module.css';

const SeasonList = () => {
  const [seasonsData, setSeasonsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  
  const { fetchSeasons } = useSeason(); // to reload context after edit
  const { openPanel } = useRightPanel();
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [formData, setFormData] = useState({ Name: '', StartDate: '', EndDate: '', IsActive: false, CopyTeams: true, CopyPlayers: true });
  const [saving, setSaving] = useState(false);

  const fetchSeasonsData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/seasons');
      setSeasonsData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las temporadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasonsData();
  }, []);

  const openModal = (season = null) => {
    if (season) {
      setEditingSeason(season);
      setFormData({ 
        Name: season.Name || '', 
        StartDate: season.StartDate ? season.StartDate.substring(0, 10) : '', 
        EndDate: season.EndDate ? season.EndDate.substring(0, 10) : '', 
        IsActive: !!season.IsActive,
        CopyTeams: true,
        CopyPlayers: true
      });
    } else {
      setEditingSeason(null);
      setFormData({ Name: '', StartDate: '', EndDate: '', IsActive: false, CopyTeams: true, CopyPlayers: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.StartDate && formData.EndDate) {
      if (new Date(formData.EndDate) < new Date(formData.StartDate)) {
        setError('La fecha de fin no puede ser anterior a la fecha de inicio.');
        return;
      }
    }
    
    setSaving(true);
    
    const payload = { ...formData };
    if (!payload.StartDate) payload.StartDate = null;
    if (!payload.EndDate) payload.EndDate = null;

    try {
      if (editingSeason) {
        await apiRequest(`/api/seasons/${editingSeason.SeasonID}`, {
          method: 'PUT',
          body: payload,
          auth: true
        });
      } else {
        await apiRequest('/api/seasons', {
          method: 'POST',
          body: payload,
          auth: true
        });
      }
      
      setIsModalOpen(false);
      await fetchSeasonsData();
      await fetchSeasons(); // Sync global context
    } catch (err) {
      setError(err.message || 'Error al guardar la temporada.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (season) => {
    if (season.IsActive) {
      alert("No se puede eliminar la temporada activa. Cambia de temporada antes de intentar eliminarla.");
      return;
    }
    
    if (window.confirm(`¿Estás seguro que deseas eliminar la temporada "${season.Name}"?\n\n¡CUIDADO! Esta acción eliminará permanentemente todos los partidos y planteles asociados a esta temporada.`)) {
      try {
        await apiRequest(`/api/seasons/${season.SeasonID}`, { method: 'DELETE', auth: true });
        await fetchSeasonsData();
        await fetchSeasons(); // Sync global context
      } catch (err) {
        setError(err.message || 'Error al eliminar la temporada.');
      }
    }
  };

  const handleFinishSeason = async (season) => {
    if (window.confirm(`¿Estás seguro de finalizar la temporada "${season.Name}"?\n\nLos equipos que estén en el primer puesto de la tabla serán declarados campeones automáticamente y agregados al historial.`)) {
      try {
        await apiRequest(`/api/seasons/${season.SeasonID}/finish`, { method: 'POST', auth: true });
        await fetchSeasonsData();
        await fetchSeasons();
        alert("Temporada finalizada exitosamente.");
      } catch (err) {
        setError(err.message || 'Error al finalizar la temporada.');
      }
    }
  };

  const handleRevertFinish = async (season) => {
    if (window.confirm(`¿Estás seguro de revertir la finalización de "${season.Name}"?\n\nEsto eliminará del historial de los equipos los campeonatos ganados en esta temporada.`)) {
      try {
        await apiRequest(`/api/seasons/${season.SeasonID}/revert-finish`, { method: 'POST', auth: true });
        await fetchSeasonsData();
        await fetchSeasons();
        alert("Finalización revertida exitosamente.");
      } catch (err) {
        setError(err.message || 'Error al revertir la finalización.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader 
        title="Temporadas" 
        subtitle="Administración de temporadas de la liga" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nueva Temporada</Button>}
      />
      <Alert message={error} />

      {loading ? (
        <div className={styles.loadingGrid}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className={styles.skeletonCard}>
              <Skeleton className={styles.skeletonText1} />
              <Skeleton className={styles.skeletonText2} />
            </Card>
          ))}
        </div>
      ) : seasonsData.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyIcon}>📅</div>
          <p className={styles.emptyText}>No hay temporadas cargadas actualmente.</p>
        </Card>
      ) : (
        <div className={styles.listContainer}>
          {seasonsData.map((season) => (
            <Card 
              key={season.SeasonID} 
              onClick={() => openPanel(
                <div className="h-full bg-white flex flex-col p-8">
                  <h2 className="text-2xl font-black text-stone-900 mb-6 border-b border-stone-200 pb-4 pr-12">
                    Posiciones: {season.Name}
                  </h2>
                  <div className="flex-1 overflow-hidden">
                    <StandingsWidget seasonId={season.SeasonID} hideTitle={true} />
                  </div>
                </div>
              )}
              className={`${styles.seasonCard} ${season.IsActive ? styles.seasonCardActive : ''}`}
            >
              {season.IsActive && (
                <div className={styles.seasonCardBg}></div>
              )}
              
              <div className={styles.seasonCardInner}>
                <div className={styles.iconContainer}>
                   <div className={`${styles.iconBox} ${season.IsActive ? styles.iconBoxActive : styles.iconBoxInactive}`}>
                    {season.IsActive ? '⭐' : '🗓️'}
                   </div>
                   {season.IsActive && (
                     <span className={styles.activeBadgeDesktop}>Activa</span>
                   )}
                </div>
                
                <div className={styles.infoContainer}>
                  <h3 className={styles.title}>
                    {season.Name}
                    {season.IsActive && (
                       <span className={styles.activeBadgeMobile}>Activa</span>
                    )}
                  </h3>
                  <p className={styles.subtitle}>
                    ID: <span className={styles.subtitleHighlight}>{season.SeasonID}</span>
                  </p>
                </div>

                <div className={styles.datesContainer}>
                  <span><span className={styles.dateLabel}>Inicio:</span> {season.StartDate ? new Date(season.StartDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                  <span><span className={styles.dateLabel}>Fin:</span> {season.EndDate ? new Date(season.EndDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                </div>

                {isAdmin && (
                  <div className={styles.seasonCardActions}>
                    <button onClick={(e) => { e.stopPropagation(); openModal(season); }} className={`${styles.actionBtn} ${styles.actionBtnEdit}`}>
                      Editar
                    </button>
                    {!season.IsActive && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(season); }} className={`${styles.actionBtn} ${styles.actionBtnDelete}`}>
                        Eliminar
                      </button>
                    )}
                    {!season.IsFinished ? (
                      <button onClick={(e) => { e.stopPropagation(); handleFinishSeason(season); }} className={`${styles.actionBtn} ${styles.actionBtnFinish}`}>
                        Finalizar
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handleRevertFinish(season); }} className={`${styles.actionBtn} ${styles.actionBtnRevert}`}>
                        Revertir Cierre
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSeason ? 'Editar Temporada' : 'Nueva Temporada'}
      >
        <form onSubmit={handleSave} className={styles.form}>
          <Input 
            label="Nombre de Temporada" 
            value={formData.Name} 
            onChange={e => setFormData({...formData, Name: e.target.value})} 
            required 
            placeholder="Ej: Apertura 2026"
          />
          <div className={styles.formRow}>
             <Input 
               label="Fecha de Inicio" 
               type="date"
               value={formData.StartDate} 
               onChange={e => setFormData({...formData, StartDate: e.target.value})} 
             />
             <Input 
               label="Fecha de Fin" 
               type="date"
               min={formData.StartDate || undefined}
               value={formData.EndDate} 
               onChange={e => setFormData({...formData, EndDate: e.target.value})} 
             />
          </div>
          <div className={styles.checkboxContainer}>
            <input 
              type="checkbox" 
              id="isActive"
              className={styles.checkbox}
              checked={formData.IsActive}
              onChange={e => setFormData({...formData, IsActive: e.target.checked})}
            />
            <label htmlFor="isActive" className={styles.checkboxLabel}>
              Marcar como Temporada Activa
            </label>
          </div>
          {formData.IsActive && (
            <p className={styles.noteText}>
              Nota: Solo puede haber una temporada activa. Las demás se desactivarán.
            </p>
          )}

          {!editingSeason && (
            <div className={styles.migrationContainer}>
              <p className={styles.migrationTitle}>Opciones de Migración</p>
              
              <div className={styles.migrationRow}>
                <input 
                  type="checkbox" 
                  id="copyTeams"
                  className={styles.checkbox}
                  checked={formData.CopyTeams}
                  onChange={e => {
                    const checked = e.target.checked;
                    setFormData({...formData, CopyTeams: checked, CopyPlayers: checked ? formData.CopyPlayers : false});
                  }}
                />
                <label htmlFor="copyTeams" className={styles.migrationLabelActive}>
                  Importar Equipos de la temporada anterior
                </label>
              </div>

              <div className={styles.migrationRow}>
                <input 
                  type="checkbox" 
                  id="copyPlayers"
                  className={`${styles.checkbox} disabled:opacity-50`}
                  checked={formData.CopyPlayers}
                  disabled={!formData.CopyTeams}
                  onChange={e => setFormData({...formData, CopyPlayers: e.target.checked})}
                />
                <label htmlFor="copyPlayers" className={formData.CopyTeams ? styles.migrationLabelActive : styles.migrationLabelInactive}>
                  Importar Jugadores de la temporada anterior
                </label>
              </div>
            </div>
          )}

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

export default SeasonList;
