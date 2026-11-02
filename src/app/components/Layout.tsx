import { Outlet, NavLink } from 'react-router';
import { Moon, Sun, User, LayoutGrid, Heart, BarChart3, Spark } from './PixelIcons';
import { useDreams } from '../context/DreamContext';

const tabs = [
  { to: '/', label: 'Мечты', Icon: LayoutGrid },
  { to: '/completed', label: 'Воспоминания', Icon: Heart },
  { to: '/stats', label: 'Статистика', Icon: BarChart3, Spark },
];

export default function Layout() {
  const { theme, toggleTheme, syncing, syncError, refreshDreams } = useDreams();
  return (
    <div className="app-shell min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <NavLink to="/" className="brand"><span className="brand-symbol"><Spark size={24}/></span>Dreamboard</NavLink>
            <div className="flex gap-2">
              <button onClick={toggleTheme} aria-label={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'} className="p-3 rounded-full hover:bg-muted">{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}</button>
              <NavLink to="/profile" aria-label="Мой аккаунт" className="p-3 rounded-full hover:bg-muted"><User size={18}/></NavLink>
            </div>
          </div>
          <nav aria-label="Основные разделы" className="machine-nav grid grid-cols-3 gap-1">
            {tabs.map(({ to, label, Icon }) => <NavLink key={to} to={to} end className={({ isActive }) => `flex items-center justify-center gap-2 py-2 text-xs sm:text-sm ${isActive ? 'active' : 'opacity-70 hover:opacity-100'}`}><Icon size={16}/>{label}</NavLink>)}
          </nav>
        </div>
      </header>
      {(syncing || syncError) && <div role="status" className="max-w-6xl mx-auto px-4 py-3 text-sm text-muted-foreground">
        {syncError ? <div className="flex items-center justify-between gap-3"><span>{syncError}</span><button onClick={() => void refreshDreams()} className="underline shrink-0">Повторить</button></div> : 'Сохраняем и синхронизируем…'}
      </div>}
      <Outlet />
    </div>
  );
}
