import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Icon from '../../components/Icons/Icons';
import { findNavEntry } from '../../config/navigation';
import styles from './AppLayout.module.css';

const COLLAPSED_KEY = 'suapadaria:sidebar-collapsed';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const entry = findNavEntry(pathname);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />

      {mobileOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Abrir menu"
          >
            <Icon name="menu" size={20} />
          </button>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {entry?.section?.title && (
              <>
                <span className={styles.crumb}>{entry.section.title}</span>
                <span className={styles.sep}>/</span>
              </>
            )}
            <strong className={styles.current}>
              {entry?.item?.label ?? 'Página não encontrada'}
            </strong>
          </nav>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
