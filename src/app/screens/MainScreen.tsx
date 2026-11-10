import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus } from '../components/PixelIcons';
import { useDreams } from '../context/DreamContext';
import DreamCard from '../components/DreamCard';
import AddDreamModal, { categoryLabels, primaryClass } from '../components/AddDreamModal';
import PageHeader from '../components/PageHeader';

export default function MainScreen() {
  const { dreams, dreamProgress, loading } = useDreams();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [category, setCategory] = useState(() => sessionStorage.getItem('dreamboard-category') || 'all');
  const [adding, setAdding] = useState(false);
  useEffect(() => { sessionStorage.setItem('dreamboard-category', category); }, [category]);
  const nextDream = dreams.find(dream => dream.bucketItems.some(item => !item.checked));
  const nextTask = nextDream?.bucketItems.find(item => !item.checked);
  const filtered = dreams.filter(d => category === 'all' || d.category === category);
  return <main className="dream-board max-w-6xl mx-auto px-4 py-6 pb-12">
    <PageHeader title="Мои мечты" caption="Маленькие шаги. Большие истории." action={<button onClick={() => setAdding(true)} aria-label="Добавить мечту" className={`${primaryClass} board-add flex items-center gap-2 shrink-0`}><Plus size={18}/><span>Добавить</span></button>}/>
    {!loading && nextDream && nextTask && category === 'all' && <section className="mobile-next-step"><Link to={`/dream/${nextDream.id}`} aria-label={`Продолжить мечту: ${nextDream.title}. Следующий шаг: ${nextTask.text}`}><div className="next-step-copy"><p className="eyebrow">Следующий шаг</p><h2>{nextTask.text}</h2><p className="next-step-dream">{nextDream.title}</p></div><span className="next-step-arrow" aria-hidden="true">→</span></Link></section>}
    {dreams.length > 0 && <><div className="board-filters flex gap-2 overflow-x-auto pb-3 mb-5">{Object.entries({ all: 'Все', ...categoryLabels }).map(([value, label]) => <button key={value} onClick={() => setCategory(value)} aria-pressed={category === value} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>{label}</button>)}</div></>}
    {loading ? <p role="status">Загружаем мечты…</p> : filtered.length ? <div className="dream-board-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-8">{filtered.map(dream => <motion.div key={dream.id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }} className="min-w-0"><DreamCard dream={dream} progress={dreamProgress.find(p => p.dreamId === dream.id)} rotation={0} onClick={() => navigate(`/dream/${dream.id}`)}/></motion.div>)}</div> : <div className="board-empty rounded-3xl border border-border bg-card py-16 px-6 text-center"><h2 className="text-2xl mb-3">{dreams.length ? 'В этой категории пока пусто' : 'С чего начнётся ваша история?'}</h2><p className="text-muted-foreground text-sm mb-6">{dreams.length ? 'Выберите другую категорию или посмотрите все мечты.' : 'Добавьте то, чего давно хочется. Большой план пока не нужен.'}</p><button className={primaryClass} onClick={() => { if (dreams.length) setCategory('all'); else setAdding(true); }}>{dreams.length ? 'Показать все' : 'Добавить первую мечту'}</button></div>}
    <AddDreamModal isOpen={adding} onClose={() => setAdding(false)}/>
  </main>;
}
