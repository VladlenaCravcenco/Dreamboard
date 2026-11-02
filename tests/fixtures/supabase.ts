// Isolated browser QA adapter. Only the preview builder imports this file.
const user = { id: 'local-preview', email: 'preview@example.test', user_metadata: { name: 'Тестовый аккаунт' } };
let rows = JSON.parse(localStorage.getItem('dreamboard_preview_rows') || '[]');
const persist = () => localStorage.setItem('dreamboard_preview_rows', JSON.stringify(rows));
export const supabase = {
  auth: {
    onAuthStateChange(callback) { queueMicrotask(() => callback('INITIAL_SESSION', { user })); return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session: { user } } }; },
    async signOut() { return { error: null }; },
    async updateUser(data) { if (data.data) user.user_metadata = data.data; return { data: { user }, error: null }; },
  },
  from() {
    return {
      select() { return { eq() { return { async order() { return { data: rows, error: null }; } }; } }; },
      async upsert(row) { rows = [...rows.filter(r => r.id !== row.id), row]; persist(); return { error: null }; },
      delete() { let id; return { eq(field, value) { if (field === 'id') id = value; return this; }, async select() { rows = rows.filter(r => r.id !== id); persist(); return { data: [{ id }], error: null }; } }; },
    };
  },
};
export async function apiCall() { throw new Error('Account deletion is disabled in the QA preview'); }
