/**
 * Synchronous hint that a signed-in user is probably returning, so the guest
 * landing page is not flashed while Supabase restores the session.
 * Mirrors the inline check in index.html.
 */
export function hasStoredSession() {
  try {
    const { hash, search } = window.location;
    if (/access_token=|refresh_token=/.test(hash) || /[?&]code=/.test(search)) return true;
    return Object.keys(window.localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
  } catch {
    return false;
  }
}
