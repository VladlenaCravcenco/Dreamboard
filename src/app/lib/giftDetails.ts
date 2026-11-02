export type GiftDetails = { product_url: string; size: string; color: string; allow_similar: boolean; priority: boolean };
export type GiftPreferences = { surprise_ok?: boolean; interests?: string; colors?: string; avoid?: string; occasion?: string; occasion_date?: string | null };
export const emptyDetails: GiftDetails = { product_url: '', size: '', color: '', allow_similar: false, priority: false };
export function giftUrl(value?: string): string | undefined {
  if (!value) return;
  try { const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)return;return u.href; } catch { return; }
}
export function occasionText(p?: GiftPreferences) {
  if (!p?.occasion) return '';
  if (!p.occasion_date) return p.occasion;
  const d=new Date(`${p.occasion_date}T12:00:00`);
  return `${p.occasion} · ${d.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}`;
}
