import { daysLabel, friendOccasions } from '../lib/friendOccasions.mjs';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { wishes, type Friend } from '../lib/wishes';
import { Link2 } from 'lucide-react';
import { primaryClass } from '../components/AddDreamModal';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toLocaleUpperCase('ru-RU') || '?';
}
export default function FriendsScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      try { const data = await wishes<Friend[]>('wish_friends_list'); if (active) { setFriends(data); setError(''); } }
      catch (e) { if (active) setError((e as Error).message); }
      finally { if (active) setLoading(false); }
    }
    void load();
    const refresh = () => void load();
    window.addEventListener('focus', refresh);
    return () => { active = false; window.removeEventListener('focus', refresh); };
  }, [user?.id]);
  const upcoming = friendOccasions(friends);
  const ordered = [...friends].sort((a,b) => a.name.localeCompare(b.name, 'ru'));
  return <main className="friends-screen max-w-6xl mx-auto px-4 py-6">
    <header className="friends-heading"><h1>Друзья</h1><Link to="/share" className="friends-share" aria-label="Моя ссылка — поделиться желаниями" title="Моя ссылка"><Link2 size={24} strokeWidth={2} aria-hidden="true"/></Link></header>
    {error ? <section role="alert" className="friends-empty"><p>{error}</p><button className={primaryClass} onClick={()=>window.location.reload()}>Повторить</button></section> : loading ? <p role="status">Загружаем ваш круг…</p> : <>
      {friends.length === 0 ? <section className="friends-empty"><p>Откройте ссылку друга и нажмите «Добавить друга» — он появится здесь.</p><Link to="/share">Поделиться своими желаниями</Link></section> : <section className="friends-directory" aria-label="Сохранённые друзья"><div className="friends-strip" tabIndex={0} aria-label="Лента друзей">{ordered.map(f=><Link key={f.id} to={`/friends/${f.id}`} className={`friend-entry ${!f.available?'friend-entry-unavailable':''}`}><span className="friend-initials" aria-hidden="true">{initials(f.name)}</span><span className="friend-entry-name">{f.name}</span>{!f.available&&<span className="friend-entry-status">Нет доступа</span>}</Link>)}</div></section>}
      {friends.length>0&&<section className="friends-occasions" aria-label="Ближайшие поводы"><h2>Ближайшие поводы</h2>{upcoming.length?<div className="friends-event-list">{upcoming.map(event=><Link key={event.key} to={`/friends/${event.friend.id}`} className="friend-date" aria-label={`${event.friend.name}: ${event.title}, ${event.date.toLocaleDateString('ru-RU')}, ${daysLabel(event.days)}`}><span className="friend-calendar" aria-hidden="true"><strong>{event.date.getDate()}</strong><span>{event.date.toLocaleDateString('ru-RU',{month:'short'})}</span></span><span className="friend-event-copy"><strong>{event.friend.name}</strong><small>{event.title}</small></span><span className="friend-countdown">{daysLabel(event.days)}</span></Link>)}</div>:<p className="friends-no-dates">Пока нет поводов</p>}</section>}
    </>}
  </main>;
}
