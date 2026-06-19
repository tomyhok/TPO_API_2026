const StandingModel = require('../models/Standing');

exports.getStandings = async (req, res) => {
  try {
    const { seasonId } = req.query;
    const standings = await StandingModel.getStandings(seasonId);
    res.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
