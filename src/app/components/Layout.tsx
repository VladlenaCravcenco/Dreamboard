import React, { useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Moon, Sun, Edit2, Check, LogOut, User, CheckCircle, BarChart3, CreditCard, Bell } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LofiPlayer } from './LofiPlayer';

const SWIPE_ROUTES = ['/', '/completed', '/stats', '/card', '/reminders'];
const SWIPE_THRESHOLD = 60;

const Layout: React.FC = () => {
  const { quote, setQuote, theme, toggleTheme, refreshDreams } = useDreams();
  const { user, signOut } = useAuth();
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editedQuote, setEditedQuote] = useState(quote);
  const navigate = useNavigate();
  const location = useLocation();
  const swipeStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleSaveQuote = () => {
    setQuote(editedQuote);
    setIsEditingQuote(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveQuote();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const handleLogoClick = async () => {
    navigate('/');
    await refreshDreams();
  };

  const isActiveTab = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, button, [data-swipe-nav-ignore]')) {
      swipeStart.current = null;
      return;
    }

    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!swipeStart.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = touch.clientY - swipeStart.current.y;
    const duration = Date.now() - swipeStart.current.time;
    swipeStart.current = null;

    if (
      duration > 700 ||
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) < Math.abs(deltaY) * 1.4
    ) {
      return;
    }

    const currentIndex = SWIPE_ROUTES.indexOf(location.pathname);
    if (currentIndex === -1) return;

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextRoute = SWIPE_ROUTES[nextIndex];
    if (nextRoute) navigate(nextRoute);
  };

  return (
    <div
      className="app-shell min-h-screen bg-background overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-4">

          {/* Logo + Nav */}
          <div className="flex items-center justify-between mb-3 md:mb-4 gap-2">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-1 px-2 md:px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-all hover:scale-105 cursor-pointer flex-shrink-0"
              title="Refresh dreams"
              aria-label="Refresh dreams"
            >
              <span
                className="text-lg md:text-xl lg:text-2xl whitespace-nowrap"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Dream
              </span>
              <span
                className="text-lg md:text-xl lg:text-2xl text-primary whitespace-nowrap"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                board
              </span>
            </button>

            <div className="flex items-center gap-2 md:gap-4">
              {/* Tab Buttons */}
              <div className="flex gap-1 md:gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/completed')}
                  className={`px-2 md:px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    isActiveTab('/completed')
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  title="Completed Dreams"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden md:inline">Completed</span>
                </button>
                <button
                  onClick={() => navigate('/stats')}
                  className={`px-2 md:px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    isActiveTab('/stats')
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  title="Statistics"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden md:inline">Stats</span>
                </button>
                <button
                  onClick={() => navigate('/card')}
                  className={`px-2 md:px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    isActiveTab('/card')
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  title="Dreamcard"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden md:inline">Card</span>
                </button>
                <button
                  onClick={() => navigate('/reminders')}
                  className={`px-2 md:px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    isActiveTab('/reminders')
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  title="Reminders"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden md:inline">Reminders</span>
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-muted hover:bg-border transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Sun className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>

              {/* User Menu — always shown (protected route guarantees user exists) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full flex-shrink-0">
                    <User className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs opacity-60">
                    {user?.name && <span className="font-medium mr-1">{user.name}</span>}
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
                    <User className="w-4 h-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quote Row */}
          <div className="flex items-center gap-3 group">
            {!isEditingQuote ? (
              <>
                <p
                  className="text-sm md:text-base text-muted-foreground italic flex-1 line-clamp-1"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  "{quote}"
                </p>
                <button
                  onClick={() => {
                    setEditedQuote(quote);
                    setIsEditingQuote(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary flex-shrink-0"
                  aria-label="Edit quote"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={editedQuote}
                  onChange={(e) => setEditedQuote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent border-b border-primary focus:outline-none italic text-sm md:text-base"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  autoFocus
                />
                <button
                  onClick={handleSaveQuote}
                  className="p-1 text-primary hover:text-primary/80 flex-shrink-0"
                  aria-label="Save quote"
                >
                  <Check className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>

      {/* Lofi Music Player (floating) */}
      <LofiPlayer />
    </div>
  );
};

export default Layout;
