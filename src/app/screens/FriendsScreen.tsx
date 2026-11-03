import { birthdayLabel, daysLabel, friendOccasions } from '../lib/friendOccasions.mjs';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { wishes, type Friend } from '../lib/wishes';
import { User, Plus, ArrowLeft, Spark } from '../components/PixelIcons';
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
    <header className="friends-heading"><div><p className="eyebrow">Личный круг{!loading && !error && ` / ${String(friends.length).padStart(2, '0')}`}</p><h1 className="board-heading">Друзья</h1></div><Link to="/share" className="friends-share">Моя ссылка <ArrowLeft size={14} style={{transform:'rotate(135deg)'}}/></Link></header>
    <div className="friends-toolbar"><p>Близкие люди.<br/>Идеи для их счастливых моментов.</p></div>
    {error ? <section role="alert" className="friends-empty"><p>{error}</p><button className={primaryClass} onClick={()=>window.location.reload()}>Повторить</button></section> : loading ? <p role="status">Загружаем ваш круг…</p> : <>
      {friends.length === 0 ? <section className="friends-empty"><div className="friends-empty-symbol"><User size={24}/><Plus size={14}/></div><h2>Первый человек в вашем круге</h2><p>Откройте ссылку, которую прислал близкий человек, и нажмите «Добавить друга». Его список появится здесь.</p><Link to="/share">Поделиться своими желаниями ↗</Link></section> : <section className="friends-directory" aria-label="Сохранённые друзья"><div className="friends-directory-label"><span className="eyebrow">Мой круг</span><span className="eyebrow">{String(friends.length).padStart(2,'0')}</span></div><div className="friends-strip" tabIndex={0} aria-label="Лента друзей">{ordered.map((f,index)=><Link key={f.id} to={`/friends/${f.id}`} className={`friend-entry ${!f.available?'friend-entry-unavailable':''}`}><span className="friend-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span className="friend-initials" aria-hidden="true">{initials(f.name)}</span><span className="friend-entry-copy"><h2>{f.name}</h2><span className="friend-entry-count">{f.available?`${f.count} · желаний в списке`:'Доступ к списку закрыт'}</span>{f.available&&f.birthday&&<span className="friend-entry-occasion">ДР · {birthdayLabel(f.birthday)}</span>}</span><ArrowLeft size={18} className="friend-entry-arrow" style={{transform:'rotate(180deg)'}}/></Link>)}</div></section>}
      {friends.length>0&&<section className="friends-occasions" aria-label="Ближайшие поводы"><div className="friends-events-heading"><h2><Spark size={16}/> Ближайшие поводы</h2><span className="eyebrow">{upcoming.length}</span></div>{upcoming.length?<div className="friends-event-list">{upcoming.map(event=><Link key={event.key} to={`/friends/${event.friend.id}`} className="friend-date"><span className="friend-calendar" aria-hidden="true"><strong>{event.date.getDate()}</strong><span>{event.date.toLocaleDateString('ru-RU',{month:'short'})}</span></span><span><strong>{event.friend.name}</strong><small>{event.title} · {event.date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}</small><span className="friend-countdown">{daysLabel(event.days)}</span></span><ArrowLeft size={16} style={{transform:'rotate(180deg)'}}/></Link>)}</div>:<p className="text-sm text-muted-foreground">Пока нет дат. Поводы появятся, когда друзья укажут их в своих профилях или списках.</p>}</section>}
      <p className="friends-privacy">Только по личным ссылкам. Ваши заметки и планы на подарки остаются секретными.</p>
    </>}
  </main>;
}
