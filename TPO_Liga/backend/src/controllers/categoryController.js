const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { Name } = req.body;
    if (!Name) return res.status(400).json({ error: 'Name is required' });
    const newCategory = await Category.create(Name);
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name } = req.body;
    if (!Name) return res.status(400).json({ error: 'Name is required' });
    const updated = await Category.update(id, Name);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Category.delete(id);
    if (!success) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    if (error.number === 547) {
      return res.status(400).json({ error: 'No se puede eliminar esta categoría porque hay jugadores y partidos usándola. Debes eliminarlos o reasignarlos primero.' });
    }
    res.status(500).json({ error: error.message });
  }
};
