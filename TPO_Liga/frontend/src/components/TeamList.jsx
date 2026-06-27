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
import TeamDetailsWidget from './widgets/TeamDetailsWidget';

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setError('');
      try {
        const data = await apiRequest(`/api/teams?seasonId=${selectedSeasonId}`);
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los equipos.');
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
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
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
      setError(err.message || 'Error al guardar el equipo.');
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
      setError(err.message || 'Error al eliminar el equipo.');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Equipos" 
        subtitle="Listado de equipos registrados en la liga" 
        action={isAdmin && <Button onClick={() => openModal()}>+ Nuevo Equipo</Button>}
      />
      <Alert message={error} />

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-32">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4 opacity-50">🛡️</div>
          <p className="text-lg text-stone-600">No hay equipos cargados actualmente.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {teams.map((team, idx) => {
            const teamName = team.TeamName || team.Equipo || team.Name || 'Equipo Sin Nombre';
            // Generate a deterministic gradient color based on index
            const colors = [
              'from-red-500/20 to-yellow-500/5',
              'from-amber-500/20 to-pink-500/5',
              'from-emerald-500/20 to-teal-500/5',
              'from-orange-500/20 to-amber-500/5',
              'from-rose-500/20 to-red-500/5',
            ];
            const bgClass = colors[idx % colors.length];

            return (
              <Card 
                key={team.TeamID} 
                className={`relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer`}
                onClick={() => handleViewTeam(team)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${bgClass} opacity-50`}></div>
                
                {isAdmin && (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => { e.stopPropagation(); openModal(team); }} className="p-1.5 rounded-lg bg-stone-200/80 text-orange-400 hover:bg-stone-300 hover:text-orange-300 transition-colors backdrop-blur-sm border border-stone-300/50">
                      ✏️
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(team.TeamID); }} className="p-1.5 rounded-lg bg-stone-200/80 text-red-500 hover:bg-stone-300 hover:text-red-400 transition-colors backdrop-blur-sm border border-stone-300/50">
                      🗑️
                    </button>
                  </div>
                )}
                
                <div className="relative z-10 flex items-start gap-4">
                  {team.LogoURL ? (
                    <img src={team.LogoURL} alt={teamName} className="flex-shrink-0 w-12 h-12 rounded-xl object-contain bg-stone-200/80 border border-stone-300 shadow-lg group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-stone-200/80 border border-stone-300 flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                      🛡️
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg text-stone-900 group-hover:text-orange-300 transition-colors leading-tight" title={teamName}>
                      {teamName}
                    </h3>
                    {team.Coach && (
                      <p className="text-sm font-medium text-stone-500 mt-1 flex items-center gap-1">
                        <span className="opacity-70">DT:</span> {team.Coach}
                      </p>
                    )}
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
        title={editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
      >
        <form onSubmit={handleSave} className="space-y-4">
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

export default TeamList;
