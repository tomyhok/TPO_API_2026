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

const SeasonList = () => {
  const [seasonsData, setSeasonsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isAdmin = !!getToken();
  
  const { fetchSeasons } = useSeason(); // to reload context after edit
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [formData, setFormData] = useState({ Name: '', StartDate: '', EndDate: '', IsActive: false });
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
        IsActive: !!season.IsActive 
      });
    } else {
      setEditingSeason(null);
      setFormData({ Name: '', StartDate: '', EndDate: '', IsActive: false });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
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
          <p className="text-lg text-zinc-400">No hay temporadas cargadas actualmente.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {seasonsData.map((season) => (
            <Card 
              key={season.SeasonID} 
              className={`relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 ${season.IsActive ? 'border-orange-500/50 shadow-lg shadow-orange-500/5' : ''}`}
            >
              {season.IsActive && (
                <div className={`absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 opacity-50`}></div>
              )}
              
              {isAdmin && (
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button onClick={(e) => { e.stopPropagation(); openModal(season); }} className="p-1.5 rounded-lg bg-zinc-800/80 text-orange-400 hover:bg-zinc-700 hover:text-orange-300 transition-colors backdrop-blur-sm border border-zinc-700/50">
                    ✏️
                  </button>
                </div>
              )}
              
              <div className="relative z-10 flex flex-col items-start gap-4 h-full">
                <div className="flex items-center justify-between w-full">
                   <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg transition-transform ${season.IsActive ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800/80 border border-zinc-700'}`}>
                    {season.IsActive ? '⭐' : '🗓️'}
                   </div>
                   {season.IsActive && (
                     <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">Activa</span>
                   )}
                </div>
                
                <div>
                  <h3 className="font-bold text-lg text-zinc-100 group-hover:text-orange-300 transition-colors line-clamp-1">
                    {season.Name}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 mt-1">
                    ID: <span className="text-orange-400/80">{season.SeasonID}</span>
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Inicio: {season.StartDate ? new Date(season.StartDate).toLocaleDateString('es-ES') : 'N/A'} <br />
                    Fin: {season.EndDate ? new Date(season.EndDate).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
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
               value={formData.EndDate} 
               onChange={e => setFormData({...formData, EndDate: e.target.value})} 
             />
          </div>
          <div className="flex items-center gap-3 mt-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-700/50">
            <input 
              type="checkbox" 
              id="isActive"
              className="w-5 h-5 rounded border-zinc-700 text-orange-500 focus:ring-orange-500/20 bg-zinc-800"
              checked={formData.IsActive}
              onChange={e => setFormData({...formData, IsActive: e.target.checked})}
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-zinc-300 cursor-pointer select-none">
              Marcar como Temporada Activa
            </label>
          </div>
          {formData.IsActive && (
            <p className="text-xs text-amber-500/80 italic pl-1">
              Nota: Solo puede haber una temporada activa. Las demás se desactivarán.
            </p>
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
