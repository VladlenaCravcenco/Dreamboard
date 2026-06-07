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
  deleteDream: (dreamId: string) => void;
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
  };

  const refreshDreams = async () => {
    loadLocalData();
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
    return true;
  };

  const updateDreamField = async (dreamId: string, field: string, value: any) => {
    setDreams((prev) => prev.map((d) => (d.id === dreamId ? { ...d, [field]: value } : d)));
  };

  const deleteDream = (dreamId: string) => {
    setDreams((prev) => prev.filter((d) => d.id !== dreamId));
    setDreamProgress((prev) => prev.filter((p) => p.dreamId !== dreamId));
    setDreamNotes((prev) => prev.filter((n) => n.dreamId !== dreamId));
    setSavingsEvents((prev) => prev.filter((e) => e.dream_id !== dreamId));
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

  };

  const clearAllCompleted = async () => {
    setCompletedDreams([]);
    setCompletionPhotos([]);
    toast.success('All completed dreams cleared!');
  };

  // ─── Bucket items ──────────────────────────────────────────────────────────

  const _saveBucketItems = (dreamId: string, items: BucketItem[]) => {
    setDreams((prev) => prev.map((d) => (d.id === dreamId ? { ...d, bucketItems: items } : d)));
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
    setDreams((prev) => prev.map((d) => (d.id === dreamId ? { ...d, saved_amount: amount } : d)));
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
