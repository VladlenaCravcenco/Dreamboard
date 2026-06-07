/**
 * User-scoped KV store wrapper.
 * The caller must include the user ID in every key or prefix.
 */

import { createClient } from "npm:@supabase/supabase-js@2.98.0";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const assertUserScoped = (key: string, userId: string): void => {
  if (!key.includes(`:${userId}`)) {
    throw new Error(`KV key is not scoped to user ${userId}`);
  }
};

const assertKeysUserScoped = (keys: string[], userId: string): void => {
  keys.forEach((key) => assertUserScoped(key, userId));
};

// Set stores a user-scoped key-value pair.
export const set = async (key: string, value: any, userId: string): Promise<void> => {
  assertUserScoped(key, userId);
  const supabase = client();
  const { error } = await supabase.from("kv_store_92c819cc").upsert({
    key,
    value,
    user_id: userId,
  });
  if (error) {
    throw new Error(`KV set error for key ${key}: ${error.message}`);
  }
};

// Get retrieves a key-value pair for a specific user from the database
export const get = async (key: string, userId: string): Promise<any> => {
  assertUserScoped(key, userId);
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_92c819cc")
    .select("value")
    .eq("key", key)
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) {
    throw new Error(`KV get error for key ${key}: ${error.message}`);
  }
  return data?.value;
};

// Delete deletes a key-value pair for a specific user from the database
export const del = async (key: string, userId: string): Promise<void> => {
  assertUserScoped(key, userId);
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_92c819cc")
    .delete()
    .eq("key", key)
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`KV delete error for key ${key}: ${error.message}`);
  }
};

// Sets multiple user-scoped key-value pairs
export const mset = async (keys: string[], values: any[], userId: string): Promise<void> => {
  assertKeysUserScoped(keys, userId);
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_92c819cc")
    .upsert(keys.map((k, i) => ({ 
      key: k, 
      value: values[i],
      user_id: userId,
    })));
  
  if (error) {
    throw new Error(`KV mset error: ${error.message}`);
  }
};

// Gets multiple key-value pairs for a specific user from the database
export const mget = async (keys: string[], userId: string): Promise<any[]> => {
  assertKeysUserScoped(keys, userId);
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_92c819cc")
    .select("value")
    .in("key", keys)
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`KV mget error: ${error.message}`);
  }
  return data?.map((d) => d.value) ?? [];
};

// Deletes multiple key-value pairs for a specific user from the database
export const mdel = async (keys: string[], userId: string): Promise<void> => {
  assertKeysUserScoped(keys, userId);
  const supabase = client();
  const { error } = await supabase
    .from("kv_store_92c819cc")
    .delete()
    .in("key", keys)
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`KV mdel error: ${error.message}`);
  }
};

// Search for key-value pairs by prefix for a specific user
export const getByPrefix = async (prefix: string, userId: string): Promise<any[]> => {
  assertUserScoped(prefix, userId);
  const supabase = client();
  const { data, error } = await supabase
    .from("kv_store_92c819cc")
    .select("key, value")
    .like("key", prefix + "%")
    .eq("user_id", userId);
  
  if (error) {
    throw new Error(`KV getByPrefix error for prefix ${prefix}: ${error.message}`);
  }
  return data?.map((d) => d.value) ?? [];
};
