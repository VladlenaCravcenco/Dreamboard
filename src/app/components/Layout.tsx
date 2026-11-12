import { useLayoutEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import { Moon, Sun, User, Users, LayoutGrid, Heart, BarChart3, Spark } from './PixelIcons';
import { useDreams } from '../context/DreamContext';
import { CloudOff } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Мечты', Icon: LayoutGrid },
  { to: '/completed', label: 'Сбылось', Icon: Heart },
  { to: '/friends', label: 'Друзья', Icon: Users },
  { to: '/stats', label: 'Прогресс', Icon: BarChart3 },
];

export default function Layout() {
  const { pathname } = useLocation();
  const activeTab = pathname.startsWith('/friends') || pathname === '/share' ? '/friends' : pathname.startsWith('/completed') ? '/completed' : pathname === '/stats' ? '/stats' : pathname === '/' || pathname.startsWith('/dream/') ? '/' : null;
  const { theme, toggleTheme, syncing, syncError, refreshDreams } = useDreams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const positions = useRef<Record<string, number>>({});
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTop = positions.current[pathname] ?? 0;

  }, [pathname]);
  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <NavLink to="/" className="brand"><span className="brand-symbol"><Spark size={24}/></span>Dreamboard</NavLink>
            <div className="flex gap-2">
              {syncError && <button onClick={() => void refreshDreams()} title={`${syncError} Нажмите, чтобы повторить.`} aria-label={`${syncError} Повторить`} className="sync-alert p-3 rounded-full hover:bg-muted"><CloudOff size={18} aria-hidden="true"/></button>}
              <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'} className="p-3 rounded-full hover:bg-muted">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
              <NavLink to="/profile" aria-label="Профиль" title="Профиль" className="p-3 rounded-full hover:bg-muted"><User size={18}/></NavLink>
            </div>
          </div>
      <nav aria-label="Основные разделы" className="notebook-tabs">
        {tabs.map(({ to, label, Icon }) => <NavLink key={to} to={to} end aria-label={label} aria-current={activeTab === to ? 'page' : undefined} className={`notebook-tab ${activeTab === to ? 'is-active' : ''}`}><Icon size={18}/><span>{label}</span></NavLink>)}
      </nav>
        </div>
      </header>
      <div className="screen-scroll" ref={scrollRef} onScroll={event => { positions.current[pathname] = event.currentTarget.scrollTop; }}>
      <span role="status" className="sr-only">{syncError ?? (syncing ? 'Сохраняем…' : '')}</span>

      <Outlet />
      </div>
      <nav className="mobile-tabs" aria-label="Разделы приложения">
        {[...tabs, { to: '/profile', label: 'Профиль', Icon: User }].map(({ to, label, Icon }) =>
          <NavLink key={to} to={to} end aria-current={(activeTab === to || pathname === to) ? 'page' : undefined} className={(activeTab === to || pathname === to) ? 'is-active' : ''}><Icon size={22}/><span>{label}</span></NavLink>
        )}
      </nav>
    </div>
  );
}
