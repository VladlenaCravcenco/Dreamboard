import DotProgress from '../components/DotProgress';
import { Link } from 'react-router';
import { useDreams } from '../context/DreamContext';
import { dreamStats } from '../lib/dreamStats.mjs';
import { categoryLabels } from '../components/AddDreamModal';
import PageHeader from '../components/PageHeader';

export default function StatsScreen() {
  const { dreams, completedDreams } = useDreams();
  const stats = dreamStats(dreams, completedDreams);
  return <main className="stats-screen max-w-6xl mx-auto px-4 py-6 space-y-6"><PageHeader title="Мой прогресс" caption="Каждая сбывшаяся мечта — часть вашей истории."/>
    <section className="stats-hero"><DotProgress percent={stats.completedPercent}/><div><p className="eyebrow mb-4">Мечты становятся реальностью</p><p className="stats-number">{stats.completedPercent}%</p><p className="text-sm text-muted-foreground mt-4">Сбылось {stats.completed} из {stats.active + stats.completed}</p></div></section>
    <div className="grid grid-cols-2 gap-4"><Link to="/" className="p-6 bg-card border border-border rounded-2xl"><p className="text-sm text-muted-foreground">Впереди</p><p className="text-4xl text-primary my-2">{stats.active}</p><span className="text-sm">Мечты на доске →</span></Link><Link to="/completed" className="p-6 bg-card border border-border rounded-2xl"><p className="text-sm text-muted-foreground">Уже сбылось</p><p className="text-4xl text-primary my-2">{stats.completed}</p><span className="text-sm">{stats.completedPercent}% всех мечт →</span></Link></div>
    {stats.goal > 0 && <section className="p-6 bg-card border border-border rounded-2xl"><h2 className="text-xl mb-2">Накопления на активные мечты</h2><p className="text-sm text-muted-foreground mb-4">Суммы, которые вы записали самостоятельно.</p><p className="text-3xl text-primary">${stats.saved.toLocaleString()}</p><p className="text-sm text-muted-foreground mt-2">Общий бюджет: ${stats.goal.toLocaleString()}</p></section>}
    {dreams.length > 0 && <section className="p-6 bg-card border border-border rounded-2xl"><h2 className="text-xl mb-4">О чём вы мечтаете</h2><div className="space-y-3">{Object.entries(categoryLabels).map(([category, label]) => { const count = dreams.filter(d => d.category === category).length; return count > 0 && <div key={category} className="flex justify-between text-sm"><span>{label}</span><span>{count}</span></div>; })}</div></section>}
    {!dreams.length && !completedDreams.length && <p className="text-muted-foreground">Добавьте первую мечту — здесь появится ваш прогресс.</p>}
  </main>;
}
