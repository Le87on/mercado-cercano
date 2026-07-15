import { z } from "zod";

const publicEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  EXPO_PUBLIC_API_URL: z.string().url(),
});

export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  apiUrl: string;
};

export function parsePublicEnv(input: Record<string, string | undefined>): PublicEnv {
  const value = publicEnvSchema.parse(input);

  return {
    supabaseUrl: value.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: value.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    apiUrl: value.EXPO_PUBLIC_API_URL,
  };
}

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv(process.env);
}
