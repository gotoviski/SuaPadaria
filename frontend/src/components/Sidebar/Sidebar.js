import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { NAVIGATION, pathMatches } from '../../config/navigation';
import Icon from '../Icons/Icons';
import styles from './Sidebar.module.css';

export default function Sidebar({ collapsed = false, mobileOpen = false, onNavigate, onToggleCollapsed }) {
  const { pathname } = useLocation();
  const [openSections, setOpenSections] = useState(() => {
    const open = new Set();
    NAVIGATION.forEach((s) => {
      if (s.items.some((i) => pathMatches(i, pathname))) open.add(s.id);
    });
    return open;
  });

  useEffect(() => {
    const active = NAVIGATION.find((s) => s.items.some((i) => pathMatches(i, pathname)));
    if (active?.id) {
      setOpenSections((prev) => (prev.has(active.id) ? prev : new Set(prev).add(active.id)));
    }
  }, [pathname]);

  const toggleSection = (id) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const classNames = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.open : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={classNames}>
      <div className={styles.brand}>
        <span className={styles.logoMark}>SP</span>
        <span className={styles.brandName}>SuaPadaria</span>
      </div>

      <nav className={styles.nav} aria-label="Navegação principal">
        {NAVIGATION.map((section) => {
          const isOpen = openSections.has(section.id);
          const showList = !section.title || isOpen || collapsed;
          return (
            <div key={section.id} className={styles.section}>
              {section.title && (
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                >
                  <span className={styles.sectionTitle}>{section.title}</span>
                  <Icon
                    name="chevron-down"
                    size={14}
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                  />
                </button>
              )}
              {showList && (
                <ul className={styles.list}>
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        title={item.label}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          `${styles.link} ${isActive ? styles.active : ''}`
                        }
                      >
                        <Icon name={item.icon} size={18} className={styles.linkIcon} />
                        <span className={styles.linkLabel}>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={18} />
          <span className={styles.linkLabel}>{collapsed ? 'Expandir' : 'Recolher'}</span>
        </button>
      </div>
    </aside>
  );
}
