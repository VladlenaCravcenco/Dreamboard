import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export const isDemoPreview = false;

const supabaseUrl = `https://${projectId}.supabase.co`;

// Единственный экземпляр клиента — хранит сессию в localStorage автоматически
export const supabase = createClient(supabaseUrl, publicAnonKey);

export const API_BASE_URL = `${supabaseUrl}/functions/v1/make-server-92c819cc`;

/** Publishable keys go in apikey; only a user's session JWT goes in Authorization. */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    apikey: publicAnonKey,
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
  };
}

/**
 * Универсальный вызов сервера.
 * При 401 — однократно обновляет токен и повторяет.
 * НЕ вызывает signOut() — управление сессией только в AuthContext.
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const doRequest = async () => {
    const headers = await getAuthHeaders();
    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string> | undefined),
      },
    });
  };

  let response = await doRequest();

  // При 401 пробуем обновить токен и повторяем
  if (response.status === 401) {
    console.warn(`[apiCall] 401 на ${endpoint}, обновляю токен…`);
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      console.warn('[apiCall] Не удалось обновить токен');
      throw new Error('Сессия истекла, войдите снова');
    }

    response = await doRequest();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`[apiCall] Ошибка ${response.status} на ${endpoint}:`, data);
    const message = data.error || data.message || `Ошибка запроса (${response.status})`;
    throw new Error(`${message} [${response.status} ${endpoint}]`);
  }

  return data;
}

/**
 * Загрузка файла (картинки) на сервер.
 * FormData не может использовать Content-Type: application/json.
 */
export async function uploadFile(file: File, dreamId: string, type: 'cover' | 'completion') {
  const { data: { session } } = await supabase.auth.getSession();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('dreamId', dreamId);
  formData.append('type', type);

  const response = await fetch(`${API_BASE_URL}/upload-image`, {
    method: 'POST',
    headers: {
      apikey: publicAnonKey,
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить файл');
  }

  return data.url as string;
}
