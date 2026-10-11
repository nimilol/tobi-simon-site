/* ═══════════════════════════════════════════════════════════
   SHARED DATA CONTRACT
   Imported by every public page (through assets/site.js) and by
   admin.html, so the pages can never disagree about the shape of
   the data.
   ═══════════════════════════════════════════════════════════ */

export const CONFIG = {
  supabase: {
    // false = demo mode: content comes from DEFAULTS below only, and the
    // admin login accepts any email with CONFIG.demoPassword.
    enabled: true,
    url:     'https://kaoctekxuznfafwcoacl.supabase.co',
    anonKey: 'sb_publishable_k-QV34vmMrw_FRyxZpvKNw__A3XuqqZ'
  },
  liveEndpoint: '',
  demoPassword: 'demo'
};

/* DEFAULTS — the shape of the data. Saved data merges on top. */
export const DEFAULTS = {
  updated: '1 August 2026',
  profile: {
    name: 'Tobi Simon',
    role: 'AfroGospel Artist · Singer · Minister of the Gospel',
    tagline: 'AfroGospel rooted in faith, worship and the message of Jesus Christ.',
    email: 'tobisimon247@gmail.com',
    heroImage: 'assets/img/hero.jpg',
    socials: {
      instagram: '',
      tiktok: '',
      youtube: 'https://www.youtube.com/@Tobiis_Simon',
      facebook: '',
      x: ''
    },
    bio: [
      'I\'m an AfroGospel artist whose music is rooted in faith, worship, and the message of Jesus Christ. I blend soulful melodies, Afro-inspired rhythms, and Spirit-led lyrics that carry themes of truth, hope, and the unconditional love of God.',
      "Called to both sing and preach the Gospel, I make music that draws listeners closer to Christ — offering comfort, strength, and a reminder of God's grace in every season. My songs are honest reflections of my walk with God: authentic, heartfelt, and spiritually uplifting.",
      'A proud child of God, I use every release to build faith and impact lives, inviting you on a journey of worship, purpose, and transformation in Christ Jesus.'
    ]
  },
  facts: [
    { k:'Genre', v:'AfroGospel' }, { k:'Based in', v:'Nigeria' },
    { k:'Distribution', v:'UnitedMasters' }, { k:'Status', v:'Independent' },
    { k:'Verified', v:'Audiomack artist' }, { k:'Open to', v:'Features & bookings' }
  ],
  platforms: [
    { id:'audiomack', name:'Audiomack',     unit:'plays',         value:152804, live:true,  url:'https://audiomack.com/tobiis_simon', top:[ { title:'Blessed', plays:151000 } ] },
    { id:'spotify',   name:'Spotify',       unit:'total streams', value:21813, live:false, url:'https://open.spotify.com/artist/5ok8MLJr3qnLKP6DsH08le', top:[
        { title:'Blessed', plays:8544 }, { title:'Grace', plays:7092 },
        { title:'Working Together', plays:2562 }, { title:'Lord', plays:906 },
        { title:'Gospel', plays:757 }
    ] },
    { id:'youtube',   name:'YouTube Music', unit:'views',         value:0, live:true,  url:'https://music.youtube.com/channel/UCFswpR9CIfDUqMCCqttb8Dw', top:[] },
    { id:'apple',     name:'Apple Music',   unit:'plays',         value:0, live:false, url:'https://music.apple.com/gb/artist/tobi-simon/1721548707', top:[] }
  ],
  /* Releases. `art` is the cover shown on the site — an uploaded file
     (admin → Releases → cover) or any image URL. `artPath` is the
     storage path of an uploaded cover, so replacing it cleans up. */
  albums: [
    { title:'Cutting the Edge', kind:'Album', year:'2023', art:'https://i.audiomack.com/tobi-simon-2/9195296-co.webp?width=760', artPath:'', links:{}, tracks:[
        { title:'Lord',             embed:'https://audiomack.com/embed/song/tobiis_simon/lord' },
        { title:'Gospel',           embed:'https://audiomack.com/embed/song/tobiis_simon/gospel' },
        { title:'Grace',            embed:'https://audiomack.com/embed/song/tobiis_simon/grace' },
        { title:'Working Together', embed:'https://audiomack.com/embed/song/tobiis_simon/working-together' },
        { title:'Its Over',         embed:'https://audiomack.com/embed/song/tobiis_simon/its-over' },
        { title:'Your Love',        embed:'https://audiomack.com/embed/song/tobiis_simon/your-love' },
        { title:'Never Suffer',     embed:'https://audiomack.com/embed/song/tobiis_simon/never-suffer' }
    ] },
    { title:'Blessed', kind:'Single', year:'2025', art:'assets/img/blessed.jpg', artPath:'', links:{}, tracks:[ { title:'Blessed', embed:'https://audiomack.com/embed/song/tobiis_simon/blessed' } ] },
    { title:'Trust',   kind:'Single', year:'2026', art:'assets/img/trust.jpg',   artPath:'', links:{}, tracks:[ { title:'Trust', embed:'https://audiomack.com/embed/song/tobiis_simon/trust' } ] }
  ],
  /* YouTube videos. kind: 'music' (music video) | 'live' | 'interview'. */
  videos: [
    { url:'https://youtube.com/shorts/RgcEPiS_Xzk', title:'The “Blessed” project', kind:'interview', date:'', venue:'', city:'' },
    { url:'https://youtube.com/shorts/Lcf_Cn6ItHI', title:'Live performance', kind:'live', date:'', venue:'', city:'' },
    { url:'https://youtube.com/shorts/MoQ81ojSmF4', title:'Live performance', kind:'live', date:'', venue:'', city:'' }
  ],
  /* Shows. `date` is YYYY-MM-DD so the site can split upcoming from past
     on its own. status: 'on-sale' | 'free' | 'sold-out' | 'tba'. */
  shows: [],
  achievements: [
    { date:'2025', title:'150,000+ plays on "Blessed"',
      text:'His single "Blessed" has passed 150K plays on Audiomack, with 6.7K+ playlist adds, 2.8K likes and 320 re-ups.' },
    { date:'2026', title:'Verified Audiomack artist',
      text:'Verified artist profile with 5,000+ monthly listeners and 285 followers across a growing catalogue.' }
  ],
  history: [],
  media: { story: [], voice: [] }
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
export function compact(n){
  n = Number(n) || 0;
  if (n >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'') + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
  return String(n);
}
export function esc(s){
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
/* Only accept saved data that actually contains something.
   An empty object is NOT valid data — the bug that cost us earlier. */
export function isRealPayload(p){
  return p && typeof p === 'object' && !Array.isArray(p) && Object.keys(p).length > 0;
}

/* YouTube id from any link shape: watch?v=, youtu.be/, /shorts/, /embed/, /live/ */
export function ytId(url){
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : '';
}
export const isVertical = v => /\/shorts\//.test(String(v?.url || ''));
export const ytThumb = (id, size = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;

/* Show dates: a real YYYY-MM-DD sorts and splits into upcoming / past;
   anything else (old free-text dates) is treated as past. */
export function showTime(s){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s?.date || ''));
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : NaN;
}
export function splitShows(shows){
  const today = new Date(); today.setHours(0,0,0,0);
  const list = Array.isArray(shows) ? shows : [];
  const upcoming = list.filter(s => showTime(s) >= today.getTime())
                       .sort((a,b) => showTime(a) - showTime(b));
  const past = list.filter(s => !(showTime(s) >= today.getTime()))
                   .sort((a,b) => (showTime(b) || 0) - (showTime(a) || 0));
  return { upcoming, past };
}

/* Newest release first: by year, then by position (later = newer).
   Returns [{ a: album, i: index in DATA.albums }]. */
export function releasesNewestFirst(albums){
  return (albums || []).map((a, i) => ({ a, i }))
    .sort((x, y) => (Number(y.a.year) || 0) - (Number(x.a.year) || 0) || y.i - x.i);
}

/* Old saves had `tours` with free-text dates. Carry real gigs across;
   drop the placeholder "Booking open" row, which the Shows page now
   covers with its own booking card. */
function migrateTours(tours){
  return (Array.isArray(tours) ? tours : [])
    .filter(t => t && t.venue && t.kind !== 'Booking open')
    .map(t => ({ date: String(t.date || ''), venue: t.venue, city: t.city || '',
                 billing: t.kind || '', status: 'tba', ticketUrl: '' }));
}

/* Merge saved data over defaults, so new fields never break old saves. */
export function hydrate(saved){
  const base = structuredClone(DEFAULTS);
  if (!isRealPayload(saved)) return base;
  const arr = (v, d) => Array.isArray(v) ? v : d;
  const out = {
    ...base, ...saved,
    profile: { ...base.profile, ...(saved.profile || {}),
               socials: { ...base.profile.socials, ...(saved.profile?.socials || {}) } },
    platforms: Array.isArray(saved.platforms) && saved.platforms.length
      ? saved.platforms.map(p => ({ ...p, top: arr(p.top, []) }))
      : base.platforms,
    albums: Array.isArray(saved.albums) && saved.albums.length
      ? saved.albums.map(a => ({ artPath: '', ...a,
                                 links: a.links && typeof a.links === 'object' ? a.links : {},
                                 tracks: arr(a.tracks, []) }))
      : base.albums,
    videos:       arr(saved.videos, base.videos),
    shows:        Array.isArray(saved.shows) ? saved.shows : migrateTours(saved.tours),
    facts:        arr(saved.facts, base.facts),
    achievements: arr(saved.achievements, base.achievements),
    history:      arr(saved.history, []),
    media: {
      story: arr(saved.media?.story, base.media.story),
      voice: arr(saved.media?.voice, base.media.voice)
    }
  };
  delete out.tours;
  return out;
}
