import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { apiCall, uploadFile } from '../lib/supabase';

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
  addDream: (dream: Omit<Dream, 'id' | 'done'>) => void;
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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      loadFromApi();
    } else {
      loadEmpty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  // ─── Guest: чистый лист ────────────────────────────────────────────────────

  const loadEmpty = () => {
    setDreams([]);
    setCompletedDreams([]);
    setDreamProgress([]);
    setDreamNotes([]);
    setCompletionPhotos([]);
    setSavingsEvents([]);
    setQuoteState(DEFAULT_QUOTE);
    setThemeState('light');
    setLoading(false);
  };

  // ─── Auth: только API ──────────────────────────────────────────────────────

  const loadFromApi = async () => {
    setLoading(true);
    try {
      const [dreamsRes, profileRes] = await Promise.allSettled([
        apiCall('/dreams'),
        apiCall('/profile'),
      ]);

      if (dreamsRes.status === 'rejected') {
        // 401 = токен ещё не готов, просто оставляем пустым — не показываем ошибку
        const msg = String(dreamsRes.reason);
        const is401 = msg.includes('401') || msg.includes('Session expired') || msg.includes('Unauthorized');
        if (!is401) {
          console.error('Failed to load dreams:', dreamsRes.reason);
          toast.error('Could not load your dreams. Please refresh.');
        }
        setLoading(false);
        return;
      }

      const all: any[] = dreamsRes.value.dreams ?? [];
      const active = all.filter((d) => !d.done);
      const done = all.filter((d) => d.done);

      setDreams(active);
      setCompletedDreams(done.map((d) => ({ ...d, completedAt: d.completed_at })));
      setDreamProgress(all.map((d) => ({ dreamId: d.id, savedAmount: d.saved_amount ?? 0 })));
      setDreamNotes(all.filter((d) => d.note).map((d) => ({ dreamId: d.id, note: d.note })));
      setCompletionPhotos(
        done
          .filter((d) => d.completion_image_url)
          .map((d) => ({ dreamId: d.id, photoUrl: d.completion_image_url }))
      );
      setSavingsEvents([]);

      if (profileRes.status === 'fulfilled' && profileRes.value.profile) {
        const p = profileRes.value.profile;
        setQuoteState(p.quote ?? DEFAULT_QUOTE);
        setThemeState(p.theme ?? 'light');
      }
    } catch (err) {
      console.error('loadFromApi error:', err);
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshDreams = async () => {
    if (user) await loadFromApi();
  };

  // ─── Quote & Theme ─────────────────────────────────────────────────────────

  const setQuote = (newQuote: string) => {
    setQuoteState(newQuote);
    if (user) {
      apiCall('/profile', { method: 'PUT', body: JSON.stringify({ quote: newQuote }) })
        .catch((e) => console.error('setQuote error:', e));
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    if (user) {
      apiCall('/profile', { method: 'PUT', body: JSON.stringify({ theme: next }) })
        .catch((e) => console.error('toggleTheme error:', e));
    }
  };

  // ─── Dream CRUD ────────────────────────────────────────────────────────────

  const addDream = async (dreamData: Omit<Dream, 'id' | 'done'>) => {
    if (user) {
      try {
        const res = await apiCall('/dreams', {
          method: 'POST',
          body: JSON.stringify({ ...dreamData, done: false, bucketItems: dreamData.bucketItems ?? [] }),
        });
        const nd: Dream = res.dream;
        setDreams((prev) => [...prev, nd]);
        setDreamProgress((prev) => [...prev, { dreamId: nd.id, savedAmount: nd.saved_amount ?? 0 }]);
      } catch (err) {
        console.error('addDream error:', err);
        toast.error('Failed to create dream');
      }
    } else {
      // Гость — только в памяти, до перезагрузки страницы
      const nd: Dream = {
        ...dreamData,
        id: `guest_${Date.now()}`,
        done: false,
        bucketItems: dreamData.bucketItems ?? [],
      };
      setDreams((prev) => [...prev, nd]);
      setDreamProgress((prev) => [...prev, { dreamId: nd.id, savedAmount: nd.saved_amount ?? 0 }]);
    }
  };

  const updateDreamField = async (dreamId: string, field: string, value: any) => {
    setDreams((prev) => prev.map((d) => (d.id === dreamId ? { ...d, [field]: value } : d)));
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify({ [field]: value }) })
        .catch((e) => console.error(`updateDreamField(${field}) error:`, e));
    }
  };

  const deleteDream = (dreamId: string) => {
    setDreams((prev) => prev.filter((d) => d.id !== dreamId));
    setDreamProgress((prev) => prev.filter((p) => p.dreamId !== dreamId));
    setDreamNotes((prev) => prev.filter((n) => n.dreamId !== dreamId));
    setSavingsEvents((prev) => prev.filter((e) => e.dream_id !== dreamId));
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'DELETE' })
        .catch((e) => console.error('deleteDream error:', e));
    }
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

    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify(updates) })
        .catch((e) => console.error('completeDream error:', e));
    }
  };

  const clearAllCompleted = async () => {
    if (user) {
      await Promise.allSettled(
        completedDreams.map((d) => apiCall(`/dreams/${d.id}`, { method: 'DELETE' }))
      );
    }
    setCompletedDreams([]);
    setCompletionPhotos([]);
    toast.success('All completed dreams cleared!');
  };

  // ─── Bucket items ──────────────────────────────────────────────────────────

  const _saveBucketItems = (dreamId: string, items: BucketItem[]) => {
    setDreams((prev) => prev.map((d) => (d.id === dreamId ? { ...d, bucketItems: items } : d)));
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify({ bucketItems: items }) })
        .catch((e) => console.error('saveBucketItems error:', e));
    }
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
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify({ completion_image_url: photoUrl }) })
        .catch((e) => console.error('setCompletionPhoto error:', e));
    }
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
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify({ saved_amount: amount }) })
        .catch((e) => console.error('updateDreamProgress error:', e));
    }
  };

  const freezeAmount = async (dreamId: string, amount: number, freezeUntil?: string) => {
    const current = dreams.find((d) => d.id === dreamId)?.saved_amount ?? 0;
    updateDreamProgress(dreamId, current + amount);

    if (user) {
      try {
        const res = await apiCall(`/dreams/${dreamId}/savings`, {
          method: 'POST',
          body: JSON.stringify({ amount, type: 'freeze_deposit', freeze_until: freezeUntil }),
        });
        setSavingsEvents((prev) => [...prev, res.event]);
      } catch (err) {
        console.error('freezeAmount error:', err);
      }
    } else {
      const ev: SavingsEvent = {
        id: `ev_${Date.now()}`,
        dream_id: dreamId,
        user_id: 'guest',
        amount,
        type: 'freeze_deposit',
        freeze_until: freezeUntil ?? null,
        created_at: new Date().toISOString(),
      };
      setSavingsEvents((prev) => [...prev, ev]);
    }
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
    if (user) {
      apiCall(`/dreams/${dreamId}`, { method: 'PUT', body: JSON.stringify({ note }) })
        .catch((e) => console.error('updateDreamNote error:', e));
    }
  };

  // ─── Image uploads ─────────────────────────────────────────────────────────

  const uploadCoverImage = async (dreamId: string, file: File) => {
    if (user) {
      try {
        const url = await uploadFile(file, dreamId, 'cover');
        await updateDreamField(dreamId, 'cover_image_url', url);
        await updateDreamField(dreamId, 'image', url);
      } catch (err) {
        console.error('uploadCoverImage error:', err);
        toast.error('Failed to upload image');
      }
    } else {
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
    }
  };

  const uploadCompletionImage = async (dreamId: string, file: File) => {
    if (user) {
      try {
        const url = await uploadFile(file, dreamId, 'completion');
        setCompletionPhoto(dreamId, url);
      } catch (err) {
        console.error('uploadCompletionImage error:', err);
        toast.error('Failed to upload photo');
      }
    } else {
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
    }
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