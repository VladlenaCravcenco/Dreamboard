import { CompletedDream } from '../types';
import { useDreams } from '../context/DreamContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

export default function CompletedDreamModal({ dream, isOpen, onClose, note = '', savedAmount = 0 }: { dream: CompletedDream | null; isOpen: boolean; onClose: () => void; note?: string; savedAmount?: number }) {
  const { completionPhotos } = useDreams();
  if (!dream) return null;
  const photo = completionPhotos.find(p => p.dreamId === dream.id)?.photoUrl || dream.completion_image_url || dream.image || '/dream-placeholder.svg';
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{dream.title}</DialogTitle><DialogDescription>{dream.completedAt ? `Мечта сбылась ${new Date(dream.completedAt).toLocaleDateString('ru-RU')}` : 'Мечта сбылась'}</DialogDescription></DialogHeader><img src={photo} alt={dream.title} className="w-full max-h-80 object-cover rounded-xl"/>
    {dream.description && <p className="text-sm whitespace-pre-wrap">{dream.description}</p>}
    {dream.bucketItems.length > 0 && <section><h3 className="font-medium mb-3">Шаги к мечте</h3><ul className="space-y-2">{dream.bucketItems.map(item => <li key={item.id} className="text-sm">{item.checked ? '✓' : '○'} {item.text}</li>)}</ul></section>}
    {note && <section><h3 className="font-medium mb-2">На память</h3><p className="text-sm whitespace-pre-wrap">{note}</p></section>}
    {!!dream.price && <p className="text-sm text-muted-foreground">Записано накоплений: ${savedAmount.toLocaleString()} · Бюджет: ${dream.price.toLocaleString()}</p>}
  </DialogContent></Dialog>;
}
