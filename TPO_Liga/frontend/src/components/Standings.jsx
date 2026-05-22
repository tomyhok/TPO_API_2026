import { useState, useEffect } from 'react';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
          throw new Error('Failed to fetch standings data');
        }
        const data = await response.json();
        setStandings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-xl text-blue-400 font-semibold animate-pulse">Loading standings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-lg text-red-500 bg-red-500/10 px-6 py-4 rounded-lg border border-red-500/20 shadow-sm">
          <span className="font-bold">Error:</span> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-2xl border border-gray-700/50 mx-auto max-w-5xl mt-6 bg-gray-800/50 backdrop-blur-sm">
      <table className="w-full text-left text-sm text-gray-300">
        <thead className="bg-gray-800 text-xs uppercase text-gray-400 border-b border-gray-700">
          <tr>
            <th className="px-6 py-5 font-semibold tracking-wider">Rank</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Team Name</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Points</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Games Played</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Wins</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Losses</th>
            <th className="px-6 py-5 font-semibold tracking-wider">Point Diff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {standings.map((team, index) => (
            <tr
              key={team.TeamID}
              className="bg-gray-900/40 hover:bg-gray-800/80 transition-all duration-200 ease-in-out"
            >
              <td className="px-6 py-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full font-bold shadow-inner bg-gray-700/30 border border-gray-700/40 text-gray-100">
                  {index + 1}
                </span>
              </td>
              <td className="px-6 py-4 font-semibold text-gray-100">{team.Equipo}</td>
              <td className="px-6 py-4 text-blue-400 font-bold text-base">{team.Puntos}</td>
              <td className="px-6 py-4 font-medium text-gray-400">{team.PartidosJugados}</td>
              <td className="px-6 py-4 text-emerald-400 font-semibold">{team.PartidosGanados}</td>
              <td className="px-6 py-4 text-rose-400 font-semibold">{team.PartidosPerdidos}</td>
              <td
                className={`px-6 py-4 font-bold ${
                  team.DiferenciaDeTantos > 0
                    ? 'text-emerald-500'
                    : team.DiferenciaDeTantos < 0
                      ? 'text-rose-500'
                      : 'text-gray-400'
                }`}
              >
                {team.DiferenciaDeTantos > 0 ? '+' : ''}
                {team.DiferenciaDeTantos}
              </td>
            </tr>
          ))}
          {standings.length === 0 && (
            <tr>
              <td colSpan="7" className="px-6 py-8 text-center text-gray-500 italic">
                No standings data available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Standings;