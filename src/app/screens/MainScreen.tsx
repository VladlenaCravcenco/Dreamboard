import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from '../components/PixelIcons';
import { useDreams } from '../context/DreamContext';
import DreamCard from '../components/DreamCard';
import AddDreamModal, { categoryLabels, primaryClass } from '../components/AddDreamModal';

export default function MainScreen() {
  const { dreams, dreamProgress, loading } = useDreams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [adding, setAdding] = useState(false);
  const filtered = dreams.filter(d => (category === 'all' || d.category === category) && `${d.title} ${d.description} ${d.tag}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="dream-board max-w-6xl mx-auto px-4 py-6 pb-12">
    <div className="board-intro flex items-start justify-between gap-4 mb-7"><div><p className="board-counter eyebrow mb-3">Личная коллекция / {dreams.length.toString().padStart(2, '0')}</p><h1 className="board-heading mb-4" style={{ fontFamily: 'var(--font-machine)' }}>Мои мечты</h1><p className="board-caption text-sm text-muted-foreground">Маленькие шаги. Большие истории.</p></div><button onClick={() => setAdding(true)} aria-label="Добавить мечту" className={`${primaryClass} board-add flex items-center gap-2 shrink-0`}><Plus size={18}/><span>Добавить</span></button></div>
    {dreams.length > 0 && <><div className="board-search relative mb-4"><Search size={18} className="absolute top-3.5 left-3 text-muted-foreground"/><input aria-label="Поиск мечты" placeholder="Найти мечту" value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm"/></div><div className="board-filters flex gap-2 overflow-x-auto pb-3 mb-5">{Object.entries({ all: 'Все', ...categoryLabels }).map(([value, label]) => <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>{label}</button>)}</div></>}
    {loading ? <p role="status">Загружаем мечты…</p> : filtered.length ? <div className="dream-board-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-8">{filtered.map(dream => <motion.div key={dream.id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }} className="min-w-0"><DreamCard dream={dream} progress={dreamProgress.find(p => p.dreamId === dream.id)} rotation={0} onClick={() => navigate(`/dream/${dream.id}`)}/></motion.div>)}</div> : <div className="board-empty rounded-3xl border border-border bg-card py-16 px-6 text-center"><h2 className="text-2xl mb-3">{dreams.length ? 'Мечта не нашлась' : 'С чего начнётся ваша история?'}</h2><p className="text-muted-foreground text-sm mb-6">{dreams.length ? 'Попробуйте другое слово или сбросьте фильтры.' : 'Добавьте то, чего давно хочется. Большой план пока не нужен.'}</p><button className={primaryClass} onClick={() => { if (dreams.length) { setQuery(''); setCategory('all'); } else setAdding(true); }}>{dreams.length ? 'Сбросить фильтры' : 'Добавить первую мечту'}</button></div>}
    <AddDreamModal isOpen={adding} onClose={() => setAdding(false)}/>
  </main>;
}
