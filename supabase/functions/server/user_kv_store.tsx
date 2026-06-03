/**
 * User-scoped KV store wrapper
 * Automatically adds user_id to all operations to work with RLS policies
 */

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Set stores a key-value pair with user_id in the database
export const set = async (key: string, value: any, userId: string): Promise<void> => {
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

// Sets multiple key-value pairs with user_id in the database
export const mset = async (keys: string[], values: any[], userId: string): Promise<void> => {
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
