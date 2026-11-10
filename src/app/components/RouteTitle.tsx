import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { siteTitle } from '../lib/siteMeta.mjs';
import { shareTitle } from '../lib/shareMetadata.mjs';

const titles: [RegExp, string][] = [
  [/^\/auth\/?$/, 'Вход'],
  [/^\/reset-password\/?$/, 'Новый пароль'],
  [/^\/dream\//, 'Мечта'],
  [/^\/completed\/?$/, 'Сбылось'],
  [/^\/stats\/?$/, 'Прогресс'],
  [/^\/friends\/?$/, 'Друзья'],
  [/^\/friends\//, 'Список друга'],
  [/^\/share\/?$/, 'Моя ссылка'],
  [/^\/profile\/?$/, 'Профиль'],
];

export function pageTitle(pathname: string, signedIn: boolean) {
  if (pathname === '/') return signedIn ? 'Мои мечты — Dreamboard' : siteTitle;
  if (/^\/(u|invite)\//.test(pathname)) return shareTitle;
  const match = titles.find(([pattern]) => pattern.test(pathname));
  return match ? `${match[1]} — Dreamboard` : 'Dreamboard';
}

/** Keeps document.title in sync with the current screen. */
export default function RouteTitle() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  useEffect(() => { document.title = pageTitle(pathname, !!user); }, [pathname, user]);
  return null;
}
