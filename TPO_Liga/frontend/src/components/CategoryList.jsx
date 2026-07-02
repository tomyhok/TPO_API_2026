import { useState } from 'react';
import { apiRequest } from '../services/api';
import { useCategories } from '../contexts/CategoryContext';
import Button from './ui/Button';
import Alert from './ui/Alert';
import styles from '../styles/components/CategoryList.module.css';

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
        body: { Name: newCategoryName },
        auth: true
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
      await apiRequest(`/api/categories/${id}`, { method: 'DELETE', auth: true });
      await refreshCategories();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (categoriesLoading) {
    return <div className={styles.loading}>Cargando categorías...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Administrar Categorías</h2>
      </div>

      <Alert message={errorMsg} />

      <div className={styles.panel}>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Nombre de la Categoría</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Ej: Sub-15"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className={styles.btn}>
            {loading ? 'Creando...' : 'Crear Categoría'}
          </Button>
        </form>

        <div className={styles.list}>
          {categories.length === 0 ? (
            <p className={styles.empty}>No hay categorías configuradas.</p>
          ) : (
            categories.map(c => (
              <div key={c.CategoryID} className={styles.item}>
                <span className={styles.itemName}>{c.Name}</span>
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
