import { Dream, DreamProgress } from '../types';
import { Spark, ArrowLeft } from './PixelIcons';

interface DreamCardProps {
  dream: Dream;
  progress?: DreamProgress;
  rotation: number;
  onClick: () => void;
}

export default function DreamCard({ dream, progress, onClick }: DreamCardProps) {
  const percent = dream.price && progress ? Math.min(100, Math.round(progress.savedAmount / dream.price * 100)) : null;
  const hasPhoto = dream.image && !dream.image.includes('/icon-') && !dream.image.includes('dream-placeholder');
  const round = dream.id.charCodeAt(0) % 2 === 0;
  return <button onClick={onClick} aria-label={`Открыть мечту: ${dream.title}`} className="dream-tile group text-left min-w-0 w-full">
    <div className={`dream-tile-image ${round ? 'dream-tile-image-round' : ''}`}>
      {hasPhoto ? <img src={dream.image} alt="" loading="lazy"/> : <div className="dream-tile-placeholder"><Spark size={52}/><span>всё начинается<br/>с желания</span></div>}
      <span className="dream-open"><ArrowLeft size={17} style={{ transform: 'rotate(135deg)' }}/></span>
    </div>
    <div className="dream-tile-copy"><div className="dream-tile-meta flex items-center justify-between gap-2 mt-4 mb-2"><span className="eyebrow truncate">{dream.categoryLabel}</span>{percent !== null && <span className="text-xs shrink-0">{percent}%</span>}</div>
    <h3 className="text-sm sm:text-base leading-snug line-clamp-2">{dream.title}</h3></div>
  </button>;
}
