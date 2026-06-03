export type Category = 'travel' | 'adventure' | 'personal' | 'style-health' | 'material';

export interface BucketItem {
  id: string;
  text: string;
  checked: boolean;
  isAITip?: boolean;
  isCustom?: boolean;
  source?: 'ai' | 'user';
  order_index?: number;
}

export interface Dream {
  id: string;
  category: Category;
  categoryLabel: string;
  tag: string;
  title: string;
  location?: string;
  season?: string;
  price?: number;
  duration?: string;
  difficulty?: string;
  description: string;
  bucketItems: BucketItem[];
  image: string;
  done: boolean;
  note?: string;
  // Supabase fields
  user_id?: string;
  target_amount?: number;
  saved_amount?: number;
  cover_image_url?: string;
  completion_image_url?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
}

export interface CompletedDream extends Omit<Dream, 'image'> {
  completedDate?: Date;
  completedAt?: string;
  completionPhotoUrl?: string;
}

export interface DreamProgress {
  dreamId: string;
  savedAmount: number;
}

export interface DreamNote {
  dreamId: string;
  note: string;
}

export interface DreamCompletionPhoto {
  dreamId: string;
  photoUrl: string;
}

export interface SavingsEvent {
  id: string;
  dream_id: string;
  user_id: string;
  amount: number;
  type: 'freeze_deposit';
  freeze_until?: string | null;
  created_at: string;
}

export interface ReminderSettings {
  enabled: boolean;
  schedule_type: 'daily' | 'every2' | 'weekly' | 'weekdays';
  time_mode: '08:00' | '12:00' | '19:00' | '21:00' | 'random' | 'custom';
  custom_time?: string | null;
}

export interface LinkedCard {
  id: string;
  brand: string;
  last4: string;
  isDefault?: boolean;
}