import { useState } from 'react';
import { apiRequest } from '../services/api';
import { useCategories } from '../contexts/CategoryContext';
import Button from './ui/Button';
import Alert from './ui/Alert';

export default function CategoryList() {
  const { categories, categoriesLoading, refreshCategories } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await apiRequest('/api/categories', {
        method: 'POST',
        body: { Name: newCategoryName }
      });
      setNewCategoryName('');
      await refreshCategories();
    } catch (err) {
      setErrorMsg('Error al crear categoría: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await apiRequest(`/api/categories/${id}`, { method: 'DELETE' });
      await refreshCategories();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return <div className="text-center p-12 text-stone-600">Cargando categorías...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Administrar Categorías</h2>
      </div>

      <Alert message={errorMsg} />

      <div className="glass-panel p-6">
        <form onSubmit={handleCreate} className="flex gap-4 items-end mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-stone-600 mb-1">Nombre de la Categoría</label>
            <input
              type="text"
              required
              className="w-full bg-stone-100/50 border border-stone-300/50 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500/50"
              placeholder="Ej: Sub-15"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="whitespace-nowrap">
            {loading ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </form>

        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="text-stone-500 text-center py-4">No hay categorías configuradas.</p>
          ) : (
            categories.map(c => (
              <div key={c.CategoryID} className="flex items-center justify-between p-4 bg-stone-100/30 border border-stone-200/50 rounded-xl hover:bg-stone-200/30 transition-colors">
                <span className="font-medium text-lg">{c.Name}</span>
                <Button variant="danger" onClick={() => handleDelete(c.CategoryID)} disabled={loading}>
                  Eliminar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
