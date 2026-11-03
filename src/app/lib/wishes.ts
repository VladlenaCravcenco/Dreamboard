import type { GiftDetails, GiftPreferences } from './giftDetails';
import { supabase } from './supabase';
export type ShareSettings = { slug?: string | null; token: string; enabled: boolean; include_future: boolean; display_name: string; dream_ids: string[]; preferences?: GiftPreferences };
export type Birthday = { month: number; day: number; visible?: boolean };
export type Friend = { id: string; name: string; available: boolean; count: number; birthday?: Birthday | null; preferences?: GiftPreferences };
export type FriendDream = { id: string; title: string; description: string; image: string; price?: number; category: string; marked: boolean; details?: GiftDetails; reservation?: 'mine' | 'other' | 'free' | null; private_note?: string; gift_status?: 'idea' | 'ordered' | 'ready' };
export type Board = { id: string; name: string; saved: boolean; is_owner: boolean; dreams: FriendDream[]; birthday?: Birthday | null; preferences?: GiftPreferences };
export async function wishes<T>(name: string, args = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('Раздел ещё не подключён к базе. Нужно применить обновления базы для друзей и подарков.');
    throw new Error(error.message || 'Не удалось загрузить список. Попробуйте ещё раз.');
  }
  return data as T;
}
export const invitePath = (token: string) => `/invite/${token}`;
export function readInvite(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname.match(/^\/invite\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i)?.[1] ?? null;
  } catch { return null; }
}

export const namedInvitePath = (slug: string) => `/u/${encodeURIComponent(slug)}`;
