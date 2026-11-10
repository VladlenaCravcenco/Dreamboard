import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from '../components/PixelIcons';
import { useDreams } from '../context/DreamContext';
import DreamCard from '../components/DreamCard';
import AddDreamModal, { categoryLabels, primaryClass } from '../components/AddDreamModal';
import PageHeader from '../components/PageHeader';

export default function MainScreen() {
  const { dreams, dreamProgress, loading } = useDreams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(() => sessionStorage.getItem('dreamboard-search') || '');
  const [category, setCategory] = useState(() => sessionStorage.getItem('dreamboard-category') || 'all');
  const [adding, setAdding] = useState(false);
  useEffect(() => { sessionStorage.setItem('dreamboard-search', query); sessionStorage.setItem('dreamboard-category', category); }, [query, category]);
  const nextDream = dreams.find(dream => dream.bucketItems.some(item => !item.checked));
  const nextTask = nextDream?.bucketItems.find(item => !item.checked);
  const filtered = dreams.filter(d => (category === 'all' || d.category === category) && `${d.title} ${d.description} ${d.tag}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <main className="dream-board max-w-6xl mx-auto px-4 py-6 pb-12">
    <PageHeader eyebrow={`Личная коллекция / ${dreams.length.toString().padStart(2, '0')}`} title="Мои мечты" caption="Маленькие шаги. Большие истории." action={<button onClick={() => setAdding(true)} aria-label="Добавить мечту" className={`${primaryClass} board-add flex items-center gap-2 shrink-0`}><Plus size={18}/><span>Добавить</span></button>}/>
    {!loading && nextDream && nextTask && !query && category === 'all' && <section className="mobile-next-step"><p className="eyebrow">Следующий маленький шаг</p><h2>{nextTask.text}</h2><p>{nextDream.title}</p><button onClick={() => navigate(`/dream/${nextDream.id}`)}>Продолжить мечту <span aria-hidden="true">→</span></button></section>}
    {dreams.length > 0 && <><div className="board-search relative mb-4"><Search size={18} className="absolute top-3.5 left-3 text-muted-foreground"/><input aria-label="Поиск мечты" placeholder="Найти мечту" value={query} onChange={e => setQuery(e.target.value)} className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm"/></div><div className="board-filters flex gap-2 overflow-x-auto pb-3 mb-5">{Object.entries({ all: 'Все', ...categoryLabels }).map(([value, label]) => <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>{label}</button>)}</div></>}
    {loading ? <p role="status">Загружаем мечты…</p> : filtered.length ? <div className="dream-board-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-8">{filtered.map(dream => <motion.div key={dream.id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }} className="min-w-0"><DreamCard dream={dream} progress={dreamProgress.find(p => p.dreamId === dream.id)} rotation={0} onClick={() => navigate(`/dream/${dream.id}`)}/></motion.div>)}</div> : <div className="board-empty rounded-3xl border border-border bg-card py-16 px-6 text-center"><h2 className="text-2xl mb-3">{dreams.length ? 'Мечта не нашлась' : 'С чего начнётся ваша история?'}</h2><p className="text-muted-foreground text-sm mb-6">{dreams.length ? 'Попробуйте другое слово или сбросьте фильтры.' : 'Добавьте то, чего давно хочется. Большой план пока не нужен.'}</p><button className={primaryClass} onClick={() => { if (dreams.length) { setQuery(''); setCategory('all'); } else setAdding(true); }}>{dreams.length ? 'Сбросить фильтры' : 'Добавить первую мечту'}</button></div>}
    <AddDreamModal isOpen={adding} onClose={() => setAdding(false)}/>
  </main>;
}
