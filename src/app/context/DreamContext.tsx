import { PendingWrites } from '../lib/pendingWrites.mjs';
import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import {
  Dream,
  DreamProgress,
  DreamNote,
  BucketItem,
  CompletedDream,
  DreamCompletionPhoto,
  SavingsEvent,
} from '../types';
import { compressImage } from '../utils/imageCompression';
import { AuthContext } from './AuthContext';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DreamContextType {
  dreams: Dream[];
  completedDreams: CompletedDream[];
  dreamProgress: DreamProgress[];
  dreamNotes: DreamNote[];
  completionPhotos: DreamCompletionPhoto[];
  quote: string;
  theme: 'light' | 'dark';
  loading: boolean;
  syncing: boolean;
  syncError: string | null;
  setQuote: (quote: string) => void;
  toggleTheme: () => void;
  updateDreamProgress: (dreamId: string, amount: number) => void;
  updateDreamNote: (dreamId: string, note: string) => void;
  completeDream: (dreamId: string, photoUrl?: string) => void;
  addCustomBucketItem: (dreamId: string, text: string) => void;
  removeCustomBucketItem: (dreamId: string, itemId: string) => void;
  updateBucketItem: (dreamId: string, itemId: string, text: string) => void;
  toggleBucketItem: (dreamId: string, itemId: string) => void;
  setCompletionPhoto: (dreamId: string, photoUrl: string) => void;
  addDream: (dream: Omit<Dream, 'id' | 'done'>) => Promise<boolean>;
  updateDreamField: (dreamId: string, field: string, value: any) => Promise<void>;
  uploadCoverImage: (dreamId: string, file: File) => Promise<void>;
  uploadCompletionImage: (dreamId: string, file: File) => Promise<void>;
  freezeAmount: (dreamId: string, amount: number, freezeUntil?: string) => Promise<void>;
  getSavingsEvents: (dreamId: string) => SavingsEvent[];
  refreshDreams: () => Promise<void>;
  clearAllCompleted: () => Promise<void>;
  deleteDream: (dreamId: string) => Promise<boolean>;
}

const DEFAULT_QUOTE = 'The future belongs to those who believe in the beauty of their dreams.';

const THEME_KEY = 'dreamboard-theme';
const savedTheme = (): 'light' | 'dark' => {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
};

const toDatabaseDream = (dream: Dream | CompletedDream, userId: string) => ({
  id: dream.id,
  user_id: userId,
  category: dream.category,
  product_url: dream.product_url ?? '',
  category_label: dream.categoryLabel,
  tag: dream.tag,
  title: dream.title,
  location: dream.location ?? null,
  season: dream.season ?? null,
  price: dream.price ?? null,
  duration: dream.duration ?? null,
  difficulty: dream.difficulty ?? null,
  description: dream.description,
  bucket_items: dream.bucketItems ?? [],
  image: 'image' in dream ? dream.image : '',
  done: dream.done,
  note: dream.note ?? null,
  saved_amount: dream.saved_amount ?? 0,
  cover_image_url: dream.cover_image_url ?? null,
  completion_image_url: dream.completion_image_url ?? null,
  completed_at: dream.completed_at ?? null,
  created_at: dream.created_at ?? new Date().toISOString(),
  updated_at: dream.updated_at ?? new Date().toISOString(),
});

const fromDatabaseDream = (row: any): Dream => ({
  id: row.id,
  user_id: row.user_id,
  category: row.category,
  product_url: row.product_url ?? '',
  categoryLabel: row.category_label,
  tag: row.tag ?? '',
  title: row.title,
  location: row.location ?? undefined,
  season: row.season ?? undefined,
  price: row.price === null ? undefined : Number(row.price),
  duration: row.duration ?? undefined,
  difficulty: row.difficulty ?? undefined,
  description: row.description ?? '',
  bucketItems: row.bucket_items ?? [],
  image: row.image ?? '',
  done: row.done ?? false,
  note: row.note ?? undefined,
  saved_amount: Number(row.saved_amount ?? 0),
  cover_image_url: row.cover_image_url ?? undefined,
  completion_image_url: row.completion_image_url ?? undefined,
  completed_at: row.completed_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export const useDreams = () => {
  const ctx = useContext(DreamContext);
  if (!ctx) throw new Error('useDreams must be used within DreamProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DreamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [dreams, setDreams] = useState<Dream[]>([]);
  const [completedDreams, setCompletedDreams] = useState<CompletedDream[]>([]);
  const [dreamProgress, setDreamProgress] = useState<DreamProgress[]>([]);
  const [dreamNotes, setDreamNotes] = useState<DreamNote[]>([]);
  const [completionPhotos, setCompletionPhotos] = useState<DreamCompletionPhoto[]>([]);
  const [savingsEvents, setSavingsEvents] = useState<SavingsEvent[]>([]);
  const [quote, setQuoteState] = useState(DEFAULT_QUOTE);
  const [theme, setThemeState] = useState<'light' | 'dark'>(savedTheme);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const accountKey = user?.id ?? 'guest';
  const activeAccount = useRef(accountKey);
  activeAccount.current = accountKey;
  const revision = useRef(0);
  const queue = useMemo(() => new PendingWrites({
    storage: { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) },
    keepInMemoryOnFailure: true,
    key: `dreamboard_${accountKey}_pending`,
    send: async (record: Dream) => {
      if (!record.user_id) return;
      const { error } = await supabase.from('dreams').upsert(toDatabaseDream(record, record.user_id));
      if (error) throw error;
    },
  }), [accountKey]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* the preference is optional */ }
  }, [theme]);

  // Dreams live only in the database. Earlier versions kept a full offline copy in the
  // browser; remove those leftovers once so they stop taking up space.
  useEffect(() => {
    try {
      for (const key of Object.keys(localStorage)) if (/^dreamboard_.+_data$/.test(key)) localStorage.removeItem(key);
      globalThis.indexedDB?.deleteDatabase('dreamboard-local');
    } catch { /* nothing to clean up */ }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void loadData();
  }, [authLoading, user?.id]);

  // ─── Loading: straight from the database ───────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    setSyncError(null);
    setDreams([]);
    setCompletedDreams([]);
    setDreamProgress([]);
    setDreamNotes([]);
    setCompletionPhotos([]);
    setSavingsEvents([]);
    if (user) {
      try { await syncFromSupabase(); }
      catch (error) {
        console.error('Loading dreams failed:', error);
        if (activeAccount.current === accountKey) setSyncError('Не удалось загрузить мечты из базы.');
      }
    }
    if (activeAccount.current === accountKey) setLoading(false);
  };

  const refreshDreams = async () => {
    try { await syncFromSupabase(); }
    catch { if (activeAccount.current === accountKey) setSyncError('Не удалось синхронизировать. Проверьте подключение и повторите.'); }
  };

  useEffect(() => {
    const retry = () => { void refreshDreams(); };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [accountKey]);

  const syncFromSupabase = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);

    try {
      await queue.flush();
      const readRevision = revision.current;
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Never replace edits made while this request was in flight or another account's state.
      if (activeAccount.current !== accountKey || readRevision !== revision.current) return;
      const all = (data ?? []).map(fromDatabaseDream);
      const active = all.filter((dream) => !dream.done);
      const done = all.filter((dream) => dream.done);

      setDreams(active);
      setCompletedDreams(done.map((dream) => ({ ...dream, completedAt: dream.completed_at ?? undefined })));
      setDreamProgress(all.map((dream) => ({ dreamId: dream.id, savedAmount: dream.saved_amount ?? 0 })));
      setDreamNotes(all.filter((dream) => dream.note).map((dream) => ({ dreamId: dream.id, note: dream.note! })));
      setCompletionPhotos(
        done
          .filter((dream) => dream.completion_image_url)
          .map((dream) => ({ dreamId: dream.id, photoUrl: dream.completion_image_url! }))
      );
    } finally {
      if (activeAccount.current === accountKey) setSyncing(false);
    }
  };

  const syncDream = async (dream: Dream) => {
    if (!user) return;
    revision.current += 1;
    setSyncing(true);
    try {
      queue.put({ ...dream, user_id: user.id });
      await queue.flush();
      if (activeAccount.current === accountKey) setSyncError(null);
    } catch (error) {
      if (activeAccount.current === accountKey) {
        setSyncError('Изменения ещё не сохранились в базе — нет связи. Они отправятся сами, когда связь появится.');
      }
      throw error;
    } finally {
      if (activeAccount.current === accountKey) setSyncing(false);
    }
  };

  // ─── Quote & Theme ─────────────────────────────────────────────────────────

  const setQuote = (newQuote: string) => {
    setQuoteState(newQuote);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
  };

  // ─── Dream CRUD ────────────────────────────────────────────────────────────

  const addDream = async (dreamData: Omit<Dream, 'id' | 'done'>): Promise<boolean> => {
    const nd: Dream = {
      ...dreamData,
      id: crypto.randomUUID(),
      user_id: user?.id,
      done: false,
      bucketItems: dreamData.bucketItems ?? [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDreams((prev) => [...prev, nd]);
    setDreamProgress((prev) => [...prev, { dreamId: nd.id, savedAmount: nd.saved_amount ?? 0 }]);
    syncDream(nd).catch((error) => console.error('Failed to sync new dream:', error));
    return true;
  };

  const updateDreamField = async (dreamId: string, field: string, value: any) => {
    setDreams((prev) => prev.map((dream) => {
      if (dream.id !== dreamId) return dream;
      const updated = { ...dream, [field]: value, updated_at: new Date().toISOString() };
      syncDream(updated).catch((error) => console.error(`Failed to sync dream field ${field}:`, error));
      return updated;
    }));
  };

  const deleteDream = async (dreamId: string): Promise<boolean> => {
    if (user) {
      try { await queue.flush(); } catch { toast.error('Перед удалением нужно синхронизировать изменения.'); return false; }
      revision.current += 1;
      const { data, error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', dreamId)
        .eq('user_id', user.id)
        .select('id');

      if (error) {
        console.error('Failed to delete dream:', error);
        toast.error(`Could not delete dream: ${error.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        toast.error('Could not delete dream from the database. Check dream ownership and RLS policies.');
        return false;
      }
    }

    setDreams((prev) => prev.filter((d) => d.id !== dreamId));
    setDreamProgress((prev) => prev.filter((p) => p.dreamId !== dreamId));
    setDreamNotes((prev) => prev.filter((n) => n.dreamId !== dreamId));
    setCompletionPhotos((prev) => prev.filter((p) => p.dreamId !== dreamId));
    setSavingsEvents((prev) => prev.filter((e) => e.dream_id !== dreamId));
    return true;
  };

  // ─── Completion ────────────────────────────────────────────────────────────

  const completeDream = (dreamId: string, photoUrl?: string) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;

    const now = new Date().toISOString();
    const updates: any = { done: true, completed_at: now };
    if (photoUrl) updates.completion_image_url = photoUrl;

    const completed: CompletedDream = { ...dream, ...updates, completedAt: now };

    setDreams((prev) => prev.filter((d) => d.id !== dreamId));
    setCompletedDreams((prev) => [completed, ...prev]);
    if (photoUrl) {
      setCompletionPhotos((prev) => [{ dreamId, photoUrl }, ...prev.filter((p) => p.dreamId !== dreamId)]);
    }
    syncDream({ ...dream, ...updates }).catch((error) => console.error('Failed to sync completed dream:', error));
  };

  const clearAllCompleted = async () => {
    const completedIds = completedDreams.map((dream) => dream.id);
    setCompletedDreams([]);
    setCompletionPhotos([]);
    if (user && completedIds.length > 0) {
      const { error } = await supabase.from('dreams').delete().in('id', completedIds);
      if (error) console.error('Failed to sync completed dream deletion:', error);
    }
    toast.success('All completed dreams cleared!');
  };

  // ─── Bucket items ──────────────────────────────────────────────────────────

  const _saveBucketItems = (dreamId: string, items: BucketItem[]) => {
    setDreams((prev) => prev.map((dream) => {
      if (dream.id !== dreamId) return dream;
      const updated = { ...dream, bucketItems: items, updated_at: new Date().toISOString() };
      syncDream(updated).catch((error) => console.error('Failed to sync bucket items:', error));
      return updated;
    }));
  };

  const addCustomBucketItem = (dreamId: string, text: string) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;
    const item: BucketItem = { id: `item_${Date.now()}`, text, checked: false, isCustom: true };
    _saveBucketItems(dreamId, [...dream.bucketItems, item]);
  };

  const removeCustomBucketItem = (dreamId: string, itemId: string) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;
    _saveBucketItems(dreamId, dream.bucketItems.filter((i) => i.id !== itemId));
  };

  const updateBucketItem = (dreamId: string, itemId: string, text: string) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;
    _saveBucketItems(dreamId, dream.bucketItems.map((i) => (i.id === itemId ? { ...i, text } : i)));
  };

  const toggleBucketItem = (dreamId: string, itemId: string) => {
    const dream = dreams.find((d) => d.id === dreamId);
    if (!dream) return;
    _saveBucketItems(dreamId, dream.bucketItems.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)));
  };

  // ─── Completion photo ─────────────────────────────────────────────────────

  const setCompletionPhoto = (dreamId: string, photoUrl: string) => {
    setCompletionPhotos((prev) => [
      { dreamId, photoUrl },
      ...prev.filter((p) => p.dreamId !== dreamId),
    ]);
  };

  // ─── Progress & Savings ────────────────────────────────────────────────────

  const updateDreamProgress = (dreamId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount < 0) { toast.error('Введите сумму не меньше нуля'); return; }
    setDreamProgress((prev) => {
      const exists = prev.find((p) => p.dreamId === dreamId);
      return exists
        ? prev.map((p) => (p.dreamId === dreamId ? { ...p, savedAmount: amount } : p))
        : [...prev, { dreamId, savedAmount: amount }];
    });
    setDreams((prev) => prev.map((dream) => {
      if (dream.id !== dreamId) return dream;
      const updated = { ...dream, saved_amount: amount, updated_at: new Date().toISOString() };
      syncDream(updated).catch((error) => console.error('Failed to sync dream progress:', error));
      return updated;
    }));
  };

  const freezeAmount = async (dreamId: string, amount: number, freezeUntil?: string) => {
    const current = dreams.find((d) => d.id === dreamId)?.saved_amount ?? 0;
    updateDreamProgress(dreamId, current + amount);

    const ev: SavingsEvent = {
      id: crypto.randomUUID(),
      dream_id: dreamId,
      user_id: user?.id ?? 'guest',
      amount,
      type: 'freeze_deposit',
      freeze_until: freezeUntil ?? null,
      created_at: new Date().toISOString(),
    };
    setSavingsEvents((prev) => [...prev, ev]);
  };

  const getSavingsEvents = (dreamId: string) =>
    savingsEvents.filter((e) => e.dream_id === dreamId);

  // ─── Notes ─────────────────────────────────────────────────────────────────

  const updateDreamNote = (dreamId: string, note: string) => {
    setDreamNotes((prev) => {
      const exists = prev.find((n) => n.dreamId === dreamId);
      return exists
        ? prev.map((n) => (n.dreamId === dreamId ? { ...n, note } : n))
        : [...prev, { dreamId, note }];
    });
    setDreams((prev) => prev.map((dream) => {
      if (dream.id !== dreamId) return dream;
      const updated = { ...dream, note, updated_at: new Date().toISOString() };
      syncDream(updated).catch((error) => console.error('Failed to sync dream note:', error));
      return updated;
    }));
  };

  // ─── Image uploads ─────────────────────────────────────────────────────────

  const uploadCoverImage = async (dreamId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      try {
        const compressed = await compressImage(b64, 1200, 0.8);
        updateDreamField(dreamId, 'image', compressed);
      } catch {
        updateDreamField(dreamId, 'image', b64);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadCompletionImage = async (dreamId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      try {
        const compressed = await compressImage(b64, 600, 0.6);
        setCompletionPhoto(dreamId, compressed);
      } catch {
        toast.error('Image too large. Please use a smaller photo.');
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── Context value ─────────────────────────────────────────────────────────

  return (
    <DreamContext.Provider
      value={{
        dreams,
        completedDreams,
        dreamProgress,
        dreamNotes,
        completionPhotos,
        quote,
        theme,
        loading,
        syncing,
        syncError,
        setQuote,
        toggleTheme,
        updateDreamProgress,
        updateDreamNote,
        completeDream,
        addCustomBucketItem,
        removeCustomBucketItem,
        updateBucketItem,
        toggleBucketItem,
        setCompletionPhoto,
        addDream,
        updateDreamField,
        uploadCoverImage,
        uploadCompletionImage,
        freezeAmount,
        getSavingsEvents,
        refreshDreams,
        clearAllCompleted,
        deleteDream,
      }}
    >
      {children}
    </DreamContext.Provider>
  );
};
