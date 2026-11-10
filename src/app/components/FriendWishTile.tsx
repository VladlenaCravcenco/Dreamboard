import { useState } from 'react';
import { toast } from 'sonner';
import { wishes, type FriendDream } from '../lib/wishes';
import { categoryLabels } from './AddDreamModal';
import { Category } from '../types';
import { Check, Spark } from './PixelIcons';

/**
 * A friend's wish as a board tile (square or round photo, caption below), like the owner's
 * own board. "Куплю" reserves the gift for this friend: other friends see it as taken,
 * the list owner sees nothing. Tapping the tile opens the full details.
 */
export default function FriendWishTile({ dream: d, linkId, owner, saved, onOpen, refresh }: { dream: FriendDream; linkId: string; owner: boolean; saved: boolean; onOpen: () => void; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const mine = d.reservation === 'mine';
  const taken = d.reservation === 'other';
  const round = d.id.charCodeAt(0) % 2 === 0;
  const hasPhoto = !!d.image && !d.image.includes('dream-placeholder') && !d.image.includes('/icon-');

  async function toggle() {
    if (!saved) { toast('Сначала добавьте друга — тогда можно отмечать подарки'); return; }
    setBusy(true);
    try {
      await wishes('wish_reserve', { p_link_id: linkId, p_dream_id: d.id, p_reserved: !mine });
      toast.success(mine ? 'Отметка снята' : 'Подарок за вами. Друг не узнает.');
      await refresh();
    } catch (e) {
      toast.error((e as Error).message);
      await refresh().catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  return <div className={`friend-tile ${mine ? 'is-mine' : ''} ${taken ? 'is-taken' : ''}`}>
    <button type="button" className="friend-tile-open" onClick={onOpen} aria-label={`Подробнее: ${d.title}`}>
      <div className={`friend-tile-media ${round ? 'is-round' : ''}`}>
        {hasPhoto
          ? <img src={d.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/dream-placeholder.svg'; }}/>
          : <div className="friend-tile-placeholder"><Spark size={40}/></div>}
      </div>
      <p className="friend-tile-category">{categoryLabels[d.category as Category] ?? 'Желание'}{d.details?.priority ? ' · ★ особенно хочет' : ''}</p>
      <h3 className="friend-tile-title">{d.title}</h3>
    </button>
    {!owner && <button type="button" className="friend-tile-mark" aria-pressed={mine} disabled={busy || taken} onClick={() => void toggle()}>
      {!taken && (mine ? <Check size={14}/> : <span className="friend-tile-mark-box" aria-hidden="true"/>)}
      {taken ? 'Занято' : 'Куплю'}
    </button>}
  </div>;
}
