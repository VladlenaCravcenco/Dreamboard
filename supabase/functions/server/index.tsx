import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as userKv from './user_kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger(console.log));

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get authenticated user
async function getAuthUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return null;
  return user;
}

// ============================================================================
// AUTH ROUTES
// ============================================================================

// Signup теперь происходит напрямую через supabase.auth.signUp() на клиенте.
// Сервер больше не нужен для создания пользователей.

app.post('/make-server-92c819cc/auth/signin', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return c.json({ error: error.message }, 401);
    }
    
    return c.json({
      session: data.session,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-92c819cc/auth/signout', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Sign out error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-92c819cc/auth/reset-password', async (c) => {
  try {
    const { email } = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      console.error('Password reset error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// PROFILE ROUTES
// ============================================================================

app.get('/make-server-92c819cc/profile', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const profile = await userKv.get(`profile:${user.id}`, user.id);
    return c.json({ profile: profile || { quote: "", theme: 'light' } });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-92c819cc/profile', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { quote, theme } = await c.req.json();
    const existingProfile = await userKv.get(`profile:${user.id}`, user.id) || {};
    
    const updatedProfile = {
      ...existingProfile,
      id: user.id,
      ...(quote !== undefined && { quote }),
      ...(theme !== undefined && { theme }),
      updated_at: new Date().toISOString(),
    };
    
    await userKv.set(`profile:${user.id}`, updatedProfile, user.id);
    return c.json({ profile: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// DREAMS ROUTES
// ============================================================================

app.get('/make-server-92c819cc/dreams', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreams = await userKv.getByPrefix(`dream:${user.id}:`, user.id);
    return c.json({ dreams: dreams || [] });
  } catch (error: any) {
    console.error('Get dreams error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-92c819cc/dreams/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('id');
    const dream = await userKv.get(`dream:${user.id}:${dreamId}`, user.id);
    
    if (!dream) {
      return c.json({ error: 'Dream not found' }, 404);
    }
    
    return c.json({ dream });
  } catch (error: any) {
    console.error('Get dream error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-92c819cc/dreams', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamData = await c.req.json();
    const dreamId = `dream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const dream = {
      ...dreamData,
      id: dreamId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };
    
    await userKv.set(`dream:${user.id}:${dreamId}`, dream, user.id);
    return c.json({ dream });
  } catch (error: any) {
    console.error('Create dream error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-92c819cc/dreams/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('id');
    const updates = await c.req.json();
    
    const existingDream = await userKv.get(`dream:${user.id}:${dreamId}`, user.id);
    if (!existingDream) {
      return c.json({ error: 'Dream not found' }, 404);
    }
    
    const updatedDream = {
      ...existingDream,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    await userKv.set(`dream:${user.id}:${dreamId}`, updatedDream, user.id);
    return c.json({ dream: updatedDream });
  } catch (error: any) {
    console.error('Update dream error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-92c819cc/dreams/:id', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('id');
    await userKv.del(`dream:${user.id}:${dreamId}`, user.id);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete dream error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// BUCKET ITEMS ROUTES
// ============================================================================

app.get('/make-server-92c819cc/dreams/:dreamId/bucket-items', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const items = await userKv.getByPrefix(`bucket:${user.id}:${dreamId}:`, user.id);
    
    return c.json({ items: items || [] });
  } catch (error: any) {
    console.error('Get bucket items error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-92c819cc/dreams/:dreamId/bucket-items', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const { text, source, checked, order_index } = await c.req.json();
    const itemId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
      id: itemId,
      dream_id: dreamId,
      user_id: user.id,
      text,
      source: source || 'user',
      checked: checked || false,
      order_index: order_index || 0,
      created_at: new Date().toISOString(),
    };
    
    await userKv.set(`bucket:${user.id}:${dreamId}:${itemId}`, item, user.id);
    return c.json({ item });
  } catch (error: any) {
    console.error('Create bucket item error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-92c819cc/bucket-items/:itemId', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const itemId = c.req.param('itemId');
    const updates = await c.req.json();
    
    // Find the item (need to search by prefix since we don't know dreamId)
    const allItems = await userKv.getByPrefix(`bucket:${user.id}:`, user.id);
    const existingItem = allItems.find((item: any) => item.id === itemId);
    
    if (!existingItem) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    const updatedItem = { ...existingItem, ...updates };
    await userKv.set(`bucket:${user.id}:${existingItem.dream_id}:${itemId}`, updatedItem, user.id);
    
    return c.json({ item: updatedItem });
  } catch (error: any) {
    console.error('Update bucket item error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-92c819cc/bucket-items/:itemId', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const itemId = c.req.param('itemId');
    
    // Find and delete the item
    const allItems = await userKv.getByPrefix(`bucket:${user.id}:`, user.id);
    const existingItem = allItems.find((item: any) => item.id === itemId);
    
    if (existingItem) {
      await userKv.del(`bucket:${user.id}:${existingItem.dream_id}:${itemId}`, user.id);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete bucket item error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// NOTES ROUTES
// ============================================================================

app.get('/make-server-92c819cc/dreams/:dreamId/notes', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const note = await userKv.get(`note:${user.id}:${dreamId}`, user.id);
    
    return c.json({ note: note || { content: '' } });
  } catch (error: any) {
    console.error('Get note error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-92c819cc/dreams/:dreamId/notes', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const { content } = await c.req.json();
    
    const note = {
      dream_id: dreamId,
      user_id: user.id,
      content,
      updated_at: new Date().toISOString(),
    };
    
    await userKv.set(`note:${user.id}:${dreamId}`, note, user.id);
    return c.json({ note });
  } catch (error: any) {
    console.error('Update note error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// SAVINGS EVENTS ROUTES
// ============================================================================

app.get('/make-server-92c819cc/dreams/:dreamId/savings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const events = await userKv.getByPrefix(`savings:${user.id}:${dreamId}:`, user.id);
    
    return c.json({ events: events || [] });
  } catch (error: any) {
    console.error('Get savings events error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-92c819cc/dreams/:dreamId/savings', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const dreamId = c.req.param('dreamId');
    const { amount, type, freeze_until } = await c.req.json();
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const event = {
      id: eventId,
      dream_id: dreamId,
      user_id: user.id,
      amount,
      type: type || 'freeze_deposit',
      freeze_until: freeze_until || null,
      created_at: new Date().toISOString(),
    };
    
    await userKv.set(`savings:${user.id}:${dreamId}:${eventId}`, event, user.id);
    return c.json({ event });
  } catch (error: any) {
    console.error('Create savings event error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// REMINDERS ROUTES
// ============================================================================

app.get('/make-server-92c819cc/reminders', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const settings = await userKv.get(`reminders:${user.id}`, user.id);
    return c.json({ 
      settings: settings || {
        enabled: false,
        schedule_type: 'daily',
        time_mode: '19:00',
        custom_time: null,
      }
    });
  } catch (error: any) {
    console.error('Get reminders error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-92c819cc/reminders', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const settings = await c.req.json();
    const updated = {
      ...settings,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    
    await userKv.set(`reminders:${user.id}`, updated, user.id);
    return c.json({ settings: updated });
  } catch (error: any) {
    console.error('Update reminders error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// IMAGE UPLOAD ROUTES (using Storage)
// ============================================================================

// Initialize Storage buckets
async function initializeStorageBuckets() {
  const bucketName = 'make-92c819cc-dreamboard-images';
  
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
      });
      console.log(`Created storage bucket: ${bucketName}`);
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
}

// Call on server startup
initializeStorageBuckets();

app.post('/make-server-92c819cc/upload-image', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string; // 'cover' or 'completion'
    const dreamId = formData.get('dreamId') as string;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const bucketName = 'make-92c819cc-dreamboard-images';
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${dreamId}/${imageType}-${Date.now()}.${fileExt}`;
    
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Generate signed URL (valid for 1 year)
    const { data: signedData } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000); // 1 year in seconds
    
    return c.json({ url: signedData?.signedUrl });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-92c819cc/delete-image', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const { filePath } = await c.req.json();
    const bucketName = 'make-92c819cc-dreamboard-images';
    
    await supabaseAdmin.storage
      .from(bucketName)
      .remove([filePath]);
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Health check
app.get('/make-server-92c819cc/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ACCOUNT ROUTES
// ============================================================================

/**
 * DELETE /account
 * Deletes the authenticated user's account and all their data.
 * Requires the admin SDK (service role key).
 */
app.delete('/make-server-92c819cc/account', async (c) => {
  try {
    const user = await getAuthUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Delete all user dreams
    const dreams = await userKv.getByPrefix(`dream:${user.id}:`, user.id);
    for (const dream of (dreams || [])) {
      await userKv.del(`dream:${user.id}:${dream.id}`, user.id).catch(() => {});
    }

    // Delete profile, reminders, savings, notes, bucket items
    await userKv.del(`profile:${user.id}`, user.id).catch(() => {});
    await userKv.del(`reminders:${user.id}`, user.id).catch(() => {});

    // Delete the Supabase Auth user (requires service role)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Delete account error:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);