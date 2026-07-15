export function parseAuthCode(url: string): string | null {
  const match = /^alavuelta:\/\/auth\/callback[?#]([^#]+)$/i.exec(url.trim());
  if (!match) return null;

  for (const pair of match[1].split("&")) {
    const [rawKey, rawValue = ""] = pair.split("=", 2);
    if (decodeURIComponent(rawKey) === "code" && rawValue) {
      return decodeURIComponent(rawValue.replace(/\+/g, " "));
    }
  }
  return null;
}
