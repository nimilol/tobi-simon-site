// ============================================================
// Live stats fetcher — Audiomack + YouTube Music
//
// WHY THIS EXISTS (the important bit):
// A browser cannot call these APIs directly. Two reasons:
//   1. CORS — the platforms block requests coming from a web page.
//   2. Secrecy — your YouTube API key would be visible to anyone who
//      opens "View source". Someone could steal it and burn your quota.
// So the browser calls THIS function, and this function calls the
// platforms. The keys live on the server and never reach the visitor.
//
// DEPLOY (PowerShell):
//   supabase functions deploy stats --no-verify-jwt
//   supabase secrets set YOUTUBE_API_KEY="your-key"
//   supabase secrets set YOUTUBE_CHANNEL_ID="UCxxxxxxxx"
//   supabase secrets set AUDIOMACK_ARTIST="tobisimon"
// ============================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Cache-Control": "public, max-age=1800", // 30 min — protects your quota
};

// ---------- YouTube ----------
// Official Data API. Free tier is generous; caching keeps us well inside it.
async function youtube(): Promise<number | null> {
  const key = Deno.env.get("YOUTUBE_API_KEY");
  const channel = Deno.env.get("YOUTUBE_CHANNEL_ID");
  if (!key || !channel) return null;

  const url = `https://www.googleapis.com/youtube/v3/channels` +
    `?part=statistics&id=${channel}&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const views = json?.items?.[0]?.statistics?.viewCount;
  return views ? Number(views) : null;
}

// ---------- Audiomack ----------
// Public catalogue endpoint. Sums plays across the artist's uploads.
// If Audiomack changes this shape, adjust the field names below —
// the rest of the site keeps working on saved numbers meanwhile.
async function audiomack(): Promise<number | null> {
  const slug = Deno.env.get("AUDIOMACK_ARTIST");
  if (!slug) return null;

  const res = await fetch(
    `https://api.audiomack.com/v1/artist/${slug}/uploads?limit=100`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) return null;

  const json = await res.json();
  const items: unknown[] = json?.results ?? json?.data ?? [];
  if (!Array.isArray(items) || items.length === 0) return null;

  return items.reduce((sum: number, item) => {
    const plays = (item as Record<string, unknown>)?.playlist_plays ??
                  (item as Record<string, unknown>)?.plays ?? 0;
    return sum + (Number(plays) || 0);
  }, 0);
}

// ---------- handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Run both at once. If one platform is down, the other still returns.
  const [yt, am] = await Promise.allSettled([youtube(), audiomack()]);

  const body: Record<string, number> = {};
  if (yt.status === "fulfilled" && yt.value !== null) body.youtube = yt.value;
  if (am.status === "fulfilled" && am.value !== null) body.audiomack = am.value;

  return new Response(JSON.stringify(body), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
