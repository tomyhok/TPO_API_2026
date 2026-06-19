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
    const { Name, StartDate, EndDate, IsActive } = req.body;
    if (!Name) return res.status(400).json({ message: 'Name is required' });
    const newSeason = await SeasonModel.create(Name, StartDate, EndDate, IsActive);
    res.status(201).json(newSeason);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, StartDate, EndDate, IsActive } = req.body;
    const updated = await SeasonModel.update(id, Name, StartDate, EndDate, IsActive);
    if (!updated) return res.status(404).json({ message: 'Season not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
