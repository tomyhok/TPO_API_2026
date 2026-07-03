import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TeamList from './components/TeamList';
import MatchList from './components/MatchList';
import PlayerList from './components/PlayerList';
import SeasonList from './components/SeasonList';
import CategoryList from './components/CategoryList';
import Standings from './components/Standings';
import StandingsWidget from './components/widgets/StandingsWidget';
import LoginForm from './components/LoginForm';
import HomePage from './components/HomePage';
import Button from './components/ui/Button';
import { clearToken, getToken } from './services/api';
import { useEffect, useState } from 'react';
import { useSeason } from './contexts/SeasonContext';
import { useRightPanel } from './contexts/RightPanelContext';
import styles from './styles/App.module.css';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/standings', label: 'Posiciones' },
  { to: '/teams', label: 'Equipos' },
  { to: '/players', label: 'Jugadores' },
  { to: '/seasons', label: 'Temporadas', adminOnly: true },
  { to: '/categories', label: 'Categorías', adminOnly: true },
  { to: '/login', label: 'Login', guestOnly: true },
];

function Layout() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getToken());
  const { seasons, selectedSeasonId, setSelectedSeasonId, loading: seasonLoading } = useSeason();
  const { panelContent, isOpen, closePanel } = useRightPanel();

  useEffect(() => {
    const syncAuth = () => setToken(getToken());
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const onLogout = () => {
    clearToken();
    setToken(null);
    navigate('/login');
  };

  return (
    <div className={styles.layout}>
      
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/basketball.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <h1 className={styles.mobileTitle}>{token ? 'LNB Admin' : 'LNB'}</h1>
          </div>
          {token && (
            <Button variant="ghost" onClick={onLogout} className={styles.mobileLogoutBtn}>
              Salir
            </Button>
          )}
        </div>
        {/* Mobile Season Selector */}
        {!seasonLoading && seasons.length > 0 && (
          <select 
            className={styles.mobileSelect}
            value={selectedSeasonId || ''}
            onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
          >
            {seasons.map(s => (
              <option key={s.SeasonID} value={s.SeasonID}>
                {s.Name} {s.IsActive ? '⭐' : ''}
              </option>
            ))}
          </select>
        )}
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px' }}>
          <img src="/basketball.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <h1 className={styles.sidebarTitle} style={{ margin: 0 }}>
            Liga<br />Juvenil
          </h1>
        </div>
        
        {/* Desktop Season Selector */}
        <div className={styles.sidebarSelectContainer}>
          {seasonLoading ? (
            <div className={styles.sidebarSelectSkeleton}></div>
          ) : seasons.length > 0 ? (
            <div className={styles.sidebarSelectWrapper}>
              <select 
                className={styles.sidebarSelect}
                value={selectedSeasonId || ''}
                onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
              >
                {seasons.map(s => (
                  <option key={s.SeasonID} value={s.SeasonID}>
                    {s.Name} {s.IsActive ? '(Actual)' : ''}
                  </option>
                ))}
              </select>
              <div className={styles.sidebarSelectIcon}>▼</div>
            </div>
          ) : null}
        </div>
        
        <nav className={styles.nav}>
          {navItems.map((item) => {
            if (item.guestOnly && token) return null;
            if (item.adminOnly && !token) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {token && (
          <div className={styles.sidebarFooter}>
            <Button variant="secondary" onClick={onLogout} className={styles.sidebarLogoutBtn}>
              Cerrar sesión
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content (Center) */}
      <main className={styles.main}>
        <div className={styles.mainContainer}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/players" element={<PlayerList />} />
            <Route path="/seasons" element={<SeasonList />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/login" element={<LoginForm onLoginSuccess={() => setToken(getToken())} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* Right Panel (Desktop) */}
      <aside className={styles.rightPanelDesktop}>
        <div className={styles.rightPanelContent}>
          {panelContent ? (
            <>
              <div className={styles.rightPanelHeader}>
                <h3 className={styles.rightPanelTitle}>Detalles</h3>
                <Button variant="ghost" onClick={closePanel} className={styles.rightPanelCloseBtn}>✕</Button>
              </div>
              <div className={styles.rightPanelBody}>
                {panelContent}
              </div>
            </>
          ) : (
            <StandingsWidget />
          )}
        </div>
      </aside>

      {/* Right Panel (Mobile Overlay) */}
      {isOpen && (
        <div className={styles.mobileOverlay}>
          <div className={styles.mobileBackdrop} onClick={closePanel}></div>
          <div className={styles.mobilePanel}>
            <div className={styles.mobilePanelHeader}>
              <h3 className={styles.mobilePanelTitle}>Detalles</h3>
              <Button variant="ghost" onClick={closePanel} className={styles.mobilePanelCloseBtn}>✕</Button>
            </div>
            <div className={styles.mobilePanelBody}>
              {panelContent}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className={styles.mobileBottomNav}>
        {navItems.map((item) => {
           if (item.guestOnly && token) return null;
           if (item.adminOnly && !token) return null;
           return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? styles.mobileNavItemActive : styles.mobileNavItem
              }
            >
              <span className={styles.mobileNavText}>{item.label}</span>
            </NavLink>
           );
        })}
      </nav>
      {/* Padding for mobile bottom nav */}
      <div className={styles.mobileNavPadding}></div>
    </div>
  );
}

export default function App() {
  return <Layout />;
}
