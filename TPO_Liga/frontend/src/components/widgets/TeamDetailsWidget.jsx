import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../services/api';
import { useSeason } from '../../contexts/SeasonContext';
import { useCategories } from '../../contexts/CategoryContext';
import TeamLogo from '../ui/TeamLogo';
import styles from '../../styles/widgets/TeamDetailsWidget.module.css';

const TeamDetailsWidget = ({ team }) => {
  const [teamData, setTeamData] = useState(null);
  const [standingsData, setStandingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedSeasonId } = useSeason();
  const { categories } = useCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeSection, setActiveSection] = useState('plantel'); // 'plantel' | 'partidos'

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!team || !selectedSeasonId) return;

    const fetchTeam = async () => {
      setLoading(true);
      try {
        const [tData, sData] = await Promise.all([
          apiRequest(`/api/teams/${team.TeamID}?seasonId=${selectedSeasonId}`),
          apiRequest(`/api/standings?seasonId=${selectedSeasonId}`)
        ]);
        setTeamData(tData);
        setStandingsData(Array.isArray(sData) ? sData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [team, selectedSeasonId]);

  if (!team) return null;

  const catStandings = standingsData.filter(s => String(s.CategoryID) === String(activeCategoryId));
  const teamStandingIndex = catStandings.findIndex(s => String(s.TeamID) === String(team.TeamID));
  const teamStats = teamStandingIndex >= 0 ? catStandings[teamStandingIndex] : null;
  const rank = teamStandingIndex >= 0 ? teamStandingIndex + 1 : '-';
  const pendingMatchesCount = teamData?.PendingMatches?.filter(m => String(m.CategoryID) === String(activeCategoryId)).length || 0;

  const renderPartidos = () => {
    if (!teamData) return null;
    
    // Sort played matches descending (latest first)
    const playedMatches = (teamData.PlayedMatches || [])
      .filter(m => String(m.CategoryID) === String(activeCategoryId))
      .sort((a, b) => new Date(b.MatchDate) - new Date(a.MatchDate))
      .slice(0, 5);

    // Sort pending matches ascending (next first)
    const pendingMatches = (teamData.PendingMatches || [])
      .filter(m => String(m.CategoryID) === String(activeCategoryId))
      .sort((a, b) => new Date(a.MatchDate) - new Date(b.MatchDate))
      .slice(0, 5);

    return (
      <div className={styles.matchesContainer}>
        <div>
          <h5 className={styles.sectionTitle}>Últimos Resultados</h5>
          {playedMatches.length > 0 ? (
            <ul className={styles.matchList}>
              {playedMatches.map(m => {
                const isLocal = m.LocalTeamID === team.TeamID;
                const opponentName = isLocal ? m.VisitorTeamName : m.LocalTeamName;
                const pointsF = isLocal ? m.LocalPoints : m.VisitorPoints;
                const pointsC = isLocal ? m.VisitorPoints : m.LocalPoints;
                const won = pointsF > pointsC;
                const tied = pointsF === pointsC;
                
                return (
                  <li key={m.MatchID} className={styles.listItem}>
                    <div className={styles.matchInfo}>
                      <span className={styles.matchDate}>
                        {new Date(m.MatchDate).toLocaleDateString()} • {isLocal ? 'Local' : 'Visitante'}
                      </span>
                      <span className={styles.matchOpponent}>
                        vs {opponentName}
                      </span>
                    </div>
                    <div className={styles.matchScoreContainer}>
                      <div className={styles.matchScore}>
                        {pointsF} - {pointsC}
                      </div>
                      <span className={`${styles.matchBadgeBase} ${
                        won ? styles.matchBadgeSuccess : 
                        tied ? styles.matchBadgeNeutral : styles.matchBadgeDanger
                      }`}>
                        {won ? 'G' : tied ? 'E' : 'P'}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyMatchState}>No hay partidos jugados recientemente.</p>
          )}
        </div>

        <div>
          <h5 className={styles.sectionTitle}>Próximos Partidos</h5>
          {pendingMatches.length > 0 ? (
            <ul className={styles.matchList}>
              {pendingMatches.map(m => {
                const isLocal = m.LocalTeamID === team.TeamID;
                const opponentName = isLocal ? m.VisitorTeamName : m.LocalTeamName;

                return (
                  <li key={m.MatchID} className={styles.matchItemPending}>
                    <div className={styles.matchInfo}>
                      <span className={styles.matchDate}>
                        {new Date(m.MatchDate).toLocaleDateString()} • {isLocal ? 'Local' : 'Visitante'}
                      </span>
                      <span className={styles.matchOpponent}>
                        vs {opponentName}
                      </span>
                    </div>
                    <div className={styles.matchRoundBadge}>
                      FECHA {m.RoundNumber || '-'}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyMatchState}>No hay partidos pendientes.</p>
          )}
        </div>
      </div>
    );
  };

  const renderHistoria = () => {
    if (!teamData || !teamData.Championships) return null;
    const championships = teamData.Championships;

    return (
      <div className={styles.historyContainer}>
        <h5 className={styles.sectionTitle}>Historial de Campeonatos</h5>
        {championships.length > 0 ? (
          <ul className={styles.championshipList}>
            {championships.map(champ => (
              <li key={champ.ChampionshipID} className={styles.championshipItem}>
                <div className={styles.trophyIcon}>🏆</div>
                <div className={styles.champInfo}>
                  <span className={styles.champSeason}>{champ.SeasonName}</span>
                  <span className={styles.champCategory}>{champ.CategoryName}</span>
                </div>
                <div className={styles.champYear}>
                  {new Date(champ.StartDate).getFullYear()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyHistoryState}>
            <div className={styles.emptyHistoryIcon}>🏅</div>
            <p>Este equipo aún no registra campeonatos oficiales.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <TeamLogo 
          src={teamData?.LogoURL || team.LogoURL} 
          alt={teamData?.TeamName || team.TeamName || team.Name || team.Equipo}
          className={styles.teamLogo}
          fallbackClassName={styles.teamLogoFallback}
        />
        <div>
          <h3 className={styles.teamName}>{teamData?.TeamName || team.TeamName || team.Name || team.Equipo}</h3>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      ) : teamData ? (
        <div className={styles.contentContainer}>
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <h4 className={styles.infoTitle}>Entrenador</h4>
              <p className={styles.infoValue}>{teamData.Coach || team.Coach || 'No asignado'}</p>
            </div>
            <div className={styles.infoBox}>
              <h4 className={styles.infoTitle}>Estadio</h4>
              <p className={styles.infoValue} title={teamData.StadiumName || team.StadiumName || 'No asignado'}>
                {teamData.StadiumName || team.StadiumName || 'No asignado'}
              </p>
            </div>
          </div>
          
          <div className={styles.statGrid}>
             <div className={styles.statBoxPrimary}>
               <h4 className={`${styles.statTitleBase} ${styles.statTitle}`}>Pos</h4>
               <p className={`${styles.statValueBase} ${styles.statValue}`}>{rank}</p>
             </div>
             <div className={styles.statBoxSecondary}>
               <h4 className={`${styles.statTitleBase} ${styles.statTitle}`}>Pts</h4>
               <p className={`${styles.statValueBase} ${styles.statValue}`}>{teamStats?.Puntos ?? '-'}</p>
             </div>
             <div className={styles.statBoxSuccess}>
               <h4 className={`${styles.statTitleBase} ${styles.statTitle}`}>PG</h4>
               <p className={`${styles.statValueBase} ${styles.statValue}`}>{teamStats?.PartidosGanados ?? '-'}</p>
             </div>
             <div className={styles.statBoxSecondary}>
               <h4 className={`${styles.statTitleBase} ${styles.statTitle}`}>Pend</h4>
               <p className={`${styles.statValueBase} ${styles.statValue}`}>{pendingMatchesCount}</p>
             </div>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className={styles.tabsContainer}>
              {categories.map(cat => (
                <button
                  key={cat.CategoryID}
                  onClick={() => setActiveCategoryId(cat.CategoryID)}
                  className={`${styles.tabBtnSmall} ${activeCategoryId === cat.CategoryID ? styles.tabBtnSmallActive : ''}`}
                >
                  {cat.Name}
                </button>
              ))}
            </div>
          )}

          {/* Section Tabs: Plantel vs Partidos */}
          <div className={styles.sectionTabsContainer}>
            <button
              onClick={() => setActiveSection('plantel')}
              className={`${styles.sectionTabBtn} ${activeSection === 'plantel' ? styles.sectionTabBtnActive : ''}`}
            >
              Plantel
            </button>
            <button
              onClick={() => setActiveSection('partidos')}
              className={`${styles.sectionTabBtn} ${activeSection === 'partidos' ? styles.sectionTabBtnActive : ''}`}
            >
              Partidos
            </button>
            <button
              onClick={() => setActiveSection('historia')}
              className={`${styles.sectionTabBtn} ${activeSection === 'historia' ? styles.sectionTabBtnActive : ''}`}
            >
              Historia
            </button>
          </div>

          <div className={styles.listContainer}>
            {activeSection === 'plantel' ? (
              teamData.Players && teamData.Players.filter(p => String(p.CategoryID) === String(activeCategoryId)).length > 0 ? (
                <ul className={styles.playerList}>
                  {teamData.Players.filter(p => String(p.CategoryID) === String(activeCategoryId)).map(p => (
                    <li key={p.PlayerID} className={styles.listItem}>
                      <div className={styles.playerInfo}>
                        <div className={styles.playerAvatar}>
                          <img 
                            src={p.PhotoURL || 'https://images.fifaindex.com/fifa22/players/205340.png'} 
                            alt={`${p.FirstName} ${p.LastName}`} 
                            className={styles.avatarImg} 
                            onError={(e) => { e.target.src = 'https://images.fifaindex.com/fifa22/players/205340.png'; }}
                          />
                        </div>
                        <span className={styles.playerName}>{p.FirstName} {p.LastName}</span>
                      </div>
                      <div className={styles.playerMeta}>
                        {p.Position && <span className={styles.playerPosition}>{p.Position}</span>}
                        {p.JerseyNumber && <span className={styles.playerJersey}>#{p.JerseyNumber}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyState}>
                  No hay jugadores registrados en esta categoría.
                </p>
              )
            ) : activeSection === 'partidos' ? (
              renderPartidos()
            ) : (
              renderHistoria()
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeamDetailsWidget;
