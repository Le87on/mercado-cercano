import { describe, expect, it } from "vitest";

import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("rejects incomplete public configuration", () => {
    expect(() =>
      parsePublicEnv({
        EXPO_PUBLIC_SUPABASE_URL: "",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
        EXPO_PUBLIC_API_URL: "",
      }),
    ).toThrow();
  });

  it("maps valid Expo public variables", () => {
    expect(
      parsePublicEnv({
        EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_12345678901234567890",
        EXPO_PUBLIC_API_URL: "https://api.example.com",
      }),
    ).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabasePublishableKey: "sb_publishable_12345678901234567890",
      apiUrl: "https://api.example.com",
    });
  });
});
