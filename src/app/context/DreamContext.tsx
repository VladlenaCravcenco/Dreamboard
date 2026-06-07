import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

interface LocalDreamboardData {
  dreams: Dream[];
  completedDreams: CompletedDream[];
  dreamProgress: DreamProgress[];
  dreamNotes: DreamNote[];
  completionPhotos: DreamCompletionPhoto[];
  savingsEvents: SavingsEvent[];
  quote: string;
  theme: 'light' | 'dark';
}

const getLocalStorageKey = (userId?: string) =>
  `dreamboard_${userId ?? 'guest'}_data`;

const readLocalData = (userId?: string): LocalDreamboardData | null => {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to read local dreamboard:', error);
    return null;
  }
};

const toDatabaseDream = (dream: Dream | CompletedDream, userId: string) => ({
  id: dream.id,
  user_id: userId,
  category: dream.category,
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
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const localDataReady = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (authLoading) return;
    loadLocalData();
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (authLoading || !localDataReady.current) return;

    const data: LocalDreamboardData = {
      dreams,
      completedDreams,
      dreamProgress,
      dreamNotes,
      completionPhotos,
      savingsEvents,
      quote,
      theme,
    };

    try {
      localStorage.setItem(getLocalStorageKey(user?.id), JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local dreamboard:', error);
    }
  }, [
    authLoading,
    user?.id,
    dreams,
    completedDreams,
    dreamProgress,
    dreamNotes,
    completionPhotos,
    savingsEvents,
    quote,
    theme,
  ]);

  // ─── Local-first storage ───────────────────────────────────────────────────

  const loadLocalData = () => {
    localDataReady.current = false;
    const data = readLocalData(user?.id);

    setDreams(data?.dreams ?? []);
    setCompletedDreams(data?.completedDreams ?? []);
    setDreamProgress(data?.dreamProgress ?? []);
    setDreamNotes(data?.dreamNotes ?? []);
    setCompletionPhotos(data?.completionPhotos ?? []);
    setSavingsEvents(data?.savingsEvents ?? []);
    setQuoteState(data?.quote ?? DEFAULT_QUOTE);
    setThemeState(data?.theme ?? 'light');
    setLoading(false);
    window.setTimeout(() => {
      localDataReady.current = true;
    }, 0);

    if (user) {
      syncFromSupabase().catch((error) => {
        console.error('Dream sync failed; continuing with local data:', error);
        setSyncError(error instanceof Error ? error.message : 'Dream sync failed');
      });
    }
  };

  const refreshDreams = async () => {
    loadLocalData();
  };

  const syncFromSupabase = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);

    try {
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

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
      setSyncing(false);
    }
  };

  const syncDream = async (dream: Dream) => {
    if (!user) return;
    const { error } = await supabase
      .from('dreams')
      .upsert(toDatabaseDream(dream, user.id));
    if (error) throw error;
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

    const { image, ...rest } = dream;
    const completed: CompletedDream = { ...rest, ...updates, completedAt: now };

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
