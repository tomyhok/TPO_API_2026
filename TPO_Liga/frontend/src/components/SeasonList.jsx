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

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Temporadas" 
        subtitle="Administración de temporadas de la liga" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nueva Temporada</Button>}
      />
      <Alert message={error} />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : seasonsData.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4 opacity-50">📅</div>
          <p className="text-lg text-stone-600">No hay temporadas cargadas actualmente.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
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
              className={`relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer ${season.IsActive ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : ''}`}
            >
              {season.IsActive && (
                <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 opacity-50`}></div>
              )}
              
              {isAdmin && (
                <div className="absolute top-1/2 -translate-y-1/2 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={(e) => { e.stopPropagation(); openModal(season); }} className="p-1.5 rounded-lg bg-stone-200/80 text-orange-400 hover:bg-stone-300 hover:text-orange-300 transition-colors backdrop-blur-sm border border-stone-300/50">
                    ✏️
                  </button>
                  {!season.IsActive && (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(season); }} className="p-1.5 rounded-lg bg-stone-200/80 text-red-500 hover:bg-stone-300 hover:text-red-400 transition-colors backdrop-blur-sm border border-stone-300/50">
                      🗑️
                    </button>
                  )}
                </div>
              )}
              
              <div className="relative z-10 flex flex-row items-center gap-6 h-full w-full">
                <div className="flex items-center gap-4">
                   <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg transition-transform ${season.IsActive ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-stone-200/80 border border-stone-300'}`}>
                    {season.IsActive ? '⭐' : '🗓️'}
                   </div>
                   {season.IsActive && (
                     <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded whitespace-nowrap hidden sm:inline-block">Activa</span>
                   )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-16">
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-300 transition-colors line-clamp-1 flex items-center gap-2">
                      {season.Name}
                      {season.IsActive && (
                         <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded sm:hidden">Activa</span>
                      )}
                    </h3>
                    <p className="text-sm font-medium text-stone-500 mt-1">
                      ID: <span className="text-orange-400/80">{season.SeasonID}</span>
                    </p>
                  </div>
                  <div className="text-xs text-stone-600 flex flex-col sm:text-right gap-1">
                    <span><span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">Inicio:</span> {season.StartDate ? new Date(season.StartDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                    <span><span className="font-semibold text-stone-400 uppercase tracking-wider text-[10px]">Fin:</span> {season.EndDate ? new Date(season.EndDate).toLocaleDateString('es-ES') : 'N/A'}</span>
                  </div>
                </div>
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
        <form onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Nombre de Temporada" 
            value={formData.Name} 
            onChange={e => setFormData({...formData, Name: e.target.value})} 
            required 
            placeholder="Ej: Apertura 2026"
          />
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex items-center gap-3 mt-4 bg-stone-100/50 p-4 rounded-xl border border-stone-300/50">
            <input 
              type="checkbox" 
              id="isActive"
              className="w-5 h-5 rounded border-stone-300 text-orange-500 focus:ring-orange-500/20 bg-stone-200"
              checked={formData.IsActive}
              onChange={e => setFormData({...formData, IsActive: e.target.checked})}
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-stone-700 cursor-pointer select-none">
              Marcar como Temporada Activa
            </label>
          </div>
          {formData.IsActive && (
            <p className="text-xs text-amber-500/80 italic pl-1">
              Nota: Solo puede haber una temporada activa. Las demás se desactivarán.
            </p>
          )}

          {!editingSeason && (
            <div className="space-y-3 mt-4 bg-stone-100/50 p-4 rounded-xl border border-stone-300/50">
              <p className="text-sm font-semibold text-stone-700 mb-2">Opciones de Migración</p>
              
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="copyTeams"
                  className="w-5 h-5 rounded border-stone-300 text-orange-500 focus:ring-orange-500/20 bg-stone-200"
                  checked={formData.CopyTeams}
                  onChange={e => {
                    const checked = e.target.checked;
                    // Si desmarcamos equipos, obligatoriamente desmarcamos jugadores
                    setFormData({...formData, CopyTeams: checked, CopyPlayers: checked ? formData.CopyPlayers : false});
                  }}
                />
                <label htmlFor="copyTeams" className="text-sm text-stone-600 cursor-pointer select-none">
                  Importar Equipos de la temporada anterior
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="copyPlayers"
                  className="w-5 h-5 rounded border-stone-300 text-orange-500 focus:ring-orange-500/20 bg-stone-200 disabled:opacity-50"
                  checked={formData.CopyPlayers}
                  disabled={!formData.CopyTeams}
                  onChange={e => setFormData({...formData, CopyPlayers: e.target.checked})}
                />
                <label htmlFor="copyPlayers" className={`text-sm cursor-pointer select-none ${formData.CopyTeams ? 'text-stone-600' : 'text-stone-400'}`}>
                  Importar Jugadores de la temporada anterior
                </label>
              </div>
            </div>
          )}

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

export default SeasonList;
