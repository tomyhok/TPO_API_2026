const SeasonModel = require('../models/Season');

exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await SeasonModel.getAll();
    res.json(seasons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveSeason = async (req, res) => {
  try {
    const season = await SeasonModel.getActive();
    if (!season) return res.status(404).json({ message: 'No active season found' });
    res.json(season);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSeason = async (req, res) => {
  try {
    const { Name, StartDate, EndDate, IsActive, CopyTeams, CopyPlayers } = req.body;
    if (!Name) return res.status(400).json({ message: 'Name is required' });
    
    if (StartDate && EndDate) {
      if (new Date(EndDate) < new Date(StartDate)) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
      }
    }
    
    const newSeason = await SeasonModel.create(Name, StartDate, EndDate, IsActive, CopyTeams, CopyPlayers);
    res.status(201).json(newSeason);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, StartDate, EndDate, IsActive } = req.body;
    
    if (StartDate && EndDate) {
      if (new Date(EndDate) < new Date(StartDate)) {
        return res.status(400).json({ message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' });
      }
    }
    
    const updated = await SeasonModel.update(id, Name, StartDate, EndDate, IsActive);
    if (!updated) return res.status(404).json({ message: 'Season not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSeason = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate if it is the active season
    const allSeasons = await SeasonModel.getAll();
    const seasonToDelete = allSeasons.find(s => String(s.SeasonID) === String(id));
    
    if (!seasonToDelete) {
      return res.status(404).json({ message: 'Season not found' });
    }
    
    if (seasonToDelete.IsActive) {
      return res.status(400).json({ message: 'No se puede eliminar la temporada activa. Cambia a otra temporada antes de eliminar esta.' });
    }
    
    const success = await SeasonModel.delete(id);
    if (!success) return res.status(404).json({ message: 'Season not found' });
    
    res.json({ message: 'Temporada eliminada exitosamente' });
  } catch (err) {
    console.error('Error deleting season:', err);
    res.status(500).json({ error: 'Error al eliminar la temporada' });
  }
};

exports.finishSeason = async (req, res) => {
  try {
    const { id } = req.params;
    await SeasonModel.finishSeason(id);
    res.json({ message: 'Temporada finalizada exitosamente. Los campeones han sido registrados.' });
  } catch (err) {
    console.error('Error finishing season:', err);
    res.status(400).json({ error: err.message || 'Error al finalizar la temporada' });
  }
};

exports.revertFinishSeason = async (req, res) => {
  try {
    const { id } = req.params;
    await SeasonModel.revertFinish(id);
    res.json({ message: 'Finalización de temporada revertida. Los campeones registrados fueron eliminados.' });
  } catch (err) {
    console.error('Error reverting season finish:', err);
    res.status(400).json({ error: err.message || 'Error al revertir la finalización' });
  }
};
