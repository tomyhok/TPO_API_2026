import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useSeason } from '../contexts/SeasonContext';
import { useCategories } from '../contexts/CategoryContext';
import { useRightPanel } from '../contexts/RightPanelContext';
import Alert from './ui/Alert';
import Card from './ui/Card';
import PageHeader from './ui/PageHeader';
import Skeleton from './ui/Skeleton';
import TeamLogo from './ui/TeamLogo';
import TeamDetailsWidget from './widgets/TeamDetailsWidget';
import styles from '../styles/components/Standings.module.css';

const Standings = () => {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const { selectedSeasonId, loading: seasonLoading } = useSeason();
  const { categories, categoriesLoading } = useCategories();
  const { openPanel } = useRightPanel();

  useEffect(() => {
    if (!selectedSeasonId) {
      if (!seasonLoading) setLoading(false);
      return;
    }

    const fetchStandings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest(`/api/standings?seasonId=${selectedSeasonId}`);
        setStandings(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'No se pudo cargar la tabla.');
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [selectedSeasonId, seasonLoading]);

  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) {
      setActiveCategoryId(categories[0].CategoryID);
    }
  }, [categories, activeCategoryId]);

  const filteredStandings = standings.filter(s => String(s.CategoryID) === String(activeCategoryId));

  return (
    <div className={styles.container}>
      <PageHeader title="Tabla de Posiciones" subtitle="Clasificación general y rendimiento de equipos" />
      <Alert message={error} />

      <Card className={styles.card}>
        {categoriesLoading || seasonLoading ? (
          <div className={styles.loadingContainer}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            {/* Category Tabs */}
            <div className={styles.tabsContainer}>
              {categories.map(cat => (
                <button
                  key={cat.CategoryID}
                  onClick={() => setActiveCategoryId(cat.CategoryID)}
                  className={`${styles.tabBtn} ${activeCategoryId === cat.CategoryID ? styles.tabBtnActive : ''}`}
                >
                  {cat.Name}
                </button>
              ))}
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredStandings.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyIcon}>🏆</div>
                <p className={styles.emptyText}>No hay datos de posiciones para esta categoría.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.thPos}>Pos</th>
                      <th className={styles.thLeft}>Equipo</th>
                      <th className={styles.thDefault}>Pts</th>
                      <th className={styles.thDefault}>PJ</th>
                      <th className={styles.thWins}>PG</th>
                      <th className={styles.thLosses}>PP</th>
                      <th className={styles.thDefault}>PF</th>
                      <th className={styles.thDefault}>PC</th>
                      <th className={styles.thDefault}>Dif</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {filteredStandings.map((team, index) => {
                  const isTop3 = index < 3;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                  
                  return (
                    <tr 
                      key={team.TeamID || index} 
                      onClick={() => openPanel(<TeamDetailsWidget team={{ TeamID: team.TeamID, TeamName: team.Equipo || team.TeamName }} />)}
                      className={`${styles.tr} ${isTop3 ? styles.trTop3 : ''}`}
                    >
                      <td className={styles.tdDefault}>
                        <div className={`${styles.posBadgeBase} ${
                          index === 0 ? styles.posBadgeGold :
                          index === 1 ? styles.posBadgeSilver :
                          index === 2 ? styles.posBadgeBronze :
                          styles.posBadgeDefault
                        }`}>
                          {medal ? <span className={styles.medalText}>{medal}</span> : index + 1}
                        </div>
                      </td>
                      <td className={styles.teamCell}>
                        <TeamLogo 
                          src={team.LogoURL} 
                          alt={team.Equipo || team.TeamName}
                          className={styles.teamLogo}
                          fallbackClassName={styles.teamLogoFallback}
                        />
                        <span>{team.Equipo || team.TeamName || '-'}</span>
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pts}`}>
                        {team.Puntos ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pj}`}>
                        {team.PartidosJugados ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pg}`}>
                        {team.PartidosGanados ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pp}`}>
                        {team.PartidosPerdidos ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pf}`}>
                        {team.TantosAFavor ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.pc}`}>
                        {team.TantosEnContra ?? '-'}
                      </td>
                      <td className={`${styles.tdDefault} ${styles.difCell}`}>
                        <span className={`${styles.difBadgeBase} ${
                          (team.DiferenciaDeTantos || 0) > 0 ? styles.difBadgePositive : 
                          (team.DiferenciaDeTantos || 0) < 0 ? styles.difBadgeNegative : styles.difBadgeNeutral
                        }`}>
                          {(team.DiferenciaDeTantos > 0 ? '+' : '')}{team.DiferenciaDeTantos ?? '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default Standings;
