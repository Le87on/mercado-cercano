import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

import { parseAuthCode } from "../domain/auth";
import type { Database } from "./database.types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const secureChunkSize = 400;
const metaKey = (key: string) => `${key}.__meta`;
const chunkKey = (key: string, index: number) => `${key}.__${index}`;

const secureStorage = {
  async getItem(key: string) {
    const rawMeta = await SecureStore.getItemAsync(metaKey(key));
    if (!rawMeta) return null;
    try {
      const meta = JSON.parse(rawMeta) as { count: number; length: number };
      if (!Number.isInteger(meta.count) || meta.count < 1 || meta.count > 128 || meta.length < 1)
        return null;
      const chunks = await Promise.all(
        Array.from({ length: meta.count }, (_, index) =>
          SecureStore.getItemAsync(chunkKey(key, index)),
        ),
      );
      if (chunks.some((chunk) => chunk === null)) return null;
      const value = chunks.join("");
      return value.length === meta.length ? value : null;
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    const previousMeta = await SecureStore.getItemAsync(metaKey(key));
    let previousCount = 0;
    try {
      previousCount = previousMeta
        ? Number((JSON.parse(previousMeta) as { count?: number }).count ?? 0)
        : 0;
    } catch {
      previousCount = 0;
    }
    const chunks = Array.from({ length: Math.ceil(value.length / secureChunkSize) }, (_, index) =>
      value.slice(index * secureChunkSize, (index + 1) * secureChunkSize),
    );
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk)),
    );
    if (previousCount > chunks.length) {
      await Promise.all(
        Array.from({ length: previousCount - chunks.length }, (_, index) =>
          SecureStore.deleteItemAsync(chunkKey(key, chunks.length + index)),
        ),
      );
    }
    await SecureStore.setItemAsync(
      metaKey(key),
      JSON.stringify({ count: chunks.length, length: value.length }),
    );
  },
  async removeItem(key: string) {
    const rawMeta = await SecureStore.getItemAsync(metaKey(key));
    let count = 0;
    try {
      count = rawMeta ? Number((JSON.parse(rawMeta) as { count?: number }).count ?? 0) : 0;
    } catch {
      count = 0;
    }
    await Promise.all([
      SecureStore.deleteItemAsync(metaKey(key)),
      ...Array.from({ length: Math.min(Math.max(count, 0), 128) }, (_, index) =>
        SecureStore.deleteItemAsync(chunkKey(key, index)),
      ),
    ]);
  },
};

export const isSupabaseConfigured = Boolean(url && publishableKey);
export const authRedirectUrl = "alavuelta://auth/callback";

export const supabase = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        storage: secureStorage,
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (supabase) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export async function handleAuthDeepLink(deepLink: string) {
  const code = parseAuthCode(deepLink);
  if (!supabase || !code) return false;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return true;
}
