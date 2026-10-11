# Tobi Simon — Music Portfolio

A multi-page artist site: releases in a 3D coverflow you can play right on the
page, music videos and live performances, shows with ticket links, a mailing
list, and a booking page. Everything is edited from a private dashboard
(`admin.html`) and goes live the moment you save.

No build step, no install. Plain HTML, CSS and JavaScript on GitHub Pages,
with Supabase for the content, uploads and sign-ups.

```
tobi-simon-site/
├─ index.html        Home: wordmark, latest release, coverflow, highlights
├─ music.html        every release, tracklists, player, streaming numbers
├─ videos.html       featured videos (music videos + interviews) and Live
├─ shows.html        upcoming shows with tickets, past shows, booking card
├─ about.html        bio, quick facts, milestones, "Behind the music" photos
├─ contact.html      booking enquiry form, socials, mailing list
├─ admin.html        owner login + dashboard (not linked anywhere, noindex)
├─ 404.html
├─ assets/
│  ├─ shared-data.js CONFIG, built-in content (DEFAULTS) and data helpers
│  ├─ shared.css     colours, fonts, the liquid-glass system, buttons, forms
│  ├─ site.css       public page layout and components
│  ├─ site.js        nav/footer, auto-updating content, player, video lightbox
│  ├─ coverflow.js   the 3D slideshow (releases, live clips, photos)
│  └─ img/           portrait, built-in covers, favicon
└─ supabase/
   ├─ schema.sql     run in Supabase: content, uploads, stats, mailing list, live updates
   └─ functions/stats/  optional live Audiomack + YouTube numbers
```

---

## After this update: one thing to do

**Re-run `supabase/schema.sql`** in Supabase (**SQL Editor → New query → paste → Run**).
The whole file is safe to run again; nothing is lost. The new section at the
bottom switches on:

- **live updates**, so open pages refresh themselves when you save
- the **mailing list** table behind the "Hear it first" form
- logging of sign-ups in the visitor stats

Until you do, the site still works: pages pick up changes on reload, and the
sign-up form says it couldn't add the visitor.

---

## How auto-update works

You never need to touch code to change what's on the site.

1. **Save in admin**, and the content is written to Supabase.
2. **Any page already open** gets told about the save (Supabase Realtime) and
   re-draws itself within a second. No reload needed.
3. **On every reload**, the page shows the last version it saw instantly, then
   checks Supabase and swaps in anything newer. Visitors never see old built-in
   content flash first.
4. Pages also re-check when a visitor comes back to the tab.

**Changing code** (HTML/CSS/JS files) is different: GitHub Pages caches files
for about 10 minutes. Every page loads its CSS/JS with `?v=20261011`. When you
change code, find-and-replace that number with today's date in all files, and
everyone gets the new files on their next reload.

---

## Covers, photos and clips

In **admin → Releases**, click **New release** or **Edit**, then choose the
cover **image file** from your phone or computer. It's resized in the
browser (longest side 1600px) and uploaded to your Supabase `media` bucket
under `covers/`. Replacing a cover deletes the old file. You can still
paste an image link instead.

Tracks: paste the Audiomack song link (`audiomack.com/tobiis_simon/song/...`)
or its embed code. Admin converts either into the embed player link.

The portrait on the About page (admin → Profile), "Behind the music" photos and
live clips (admin → Photos & clips) upload the same way.

---

## Videos

Paste any YouTube link (a normal video, a Short, or youtu.be) and pick a type:

| Type | Where it shows |
|---|---|
| Music video | Featured screen on Videos; the first one is also on Home |
| Interview | Featured screen on Videos (filterable) |
| Live performance | The **Live** coverflow on Videos, with venue, city and date |

Use ↑ to reorder. The top music video or interview is the one featured on the
home page. Videos only load from YouTube (privacy-enhanced mode) when someone
presses play.

## Shows

Add a date, venue, city, billing, ticket status and ticket/RSVP link. Future
dates appear under **Upcoming** with a **Tickets** (or **RSVP** for free
events) button. Once the date passes they move to **Past shows** by
themselves. With nothing upcoming, the page shows a "Bring Tobi to your stage"
booking card.

## Mailing list

The "Hear it first" form is in every page footer and on Contact. Visitors can
only *add* an email. Nobody can read the list from the public site. See the
list in **admin → Audience** and use **Export CSV** to import it into
Mailchimp, Brevo or Gmail.

---

## Liquid glass

The nav, player, buttons, panels and lightbox use a glass material:
translucent fill, background blur and saturation, a lit top edge, and a
specular rim. Chrome and Edge also get real refraction through an SVG
displacement filter. Taps squish slightly, with a light that follows your
finger, as on iOS. Behind it all, the cover on screen is blown up and blurred
into the page background, so the glass always has colour to bend.

Everything falls back gracefully: no blur support gives solid dark panels,
and "reduce motion" turns off ripples and autoplay.

---

## Run it locally

```powershell
py -m http.server 8000
```

Then open `http://localhost:8000`. The admin is at
`http://localhost:8000/admin.html`. To try admin without a Supabase login, set
`enabled: false` in `CONFIG.supabase` (`assets/shared-data.js`). Then any
email with password `demo` works, and changes last for that session only.
Don't commit that change.

## Put it live (GitHub Pages)

Repo → **Settings → Pages** → Source: `main`, folder `/ (root)`. To update:

```powershell
git add .
git commit -m "Describe what changed"
git push
```

## Supabase setup (first time only)

1. Create a project at supabase.com.
2. **SQL Editor** → paste `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user**: create ONE account for Tobi.
4. **Authentication → Sign In / Providers → Email**: turn **off**
   "Allow new users to sign up".
5. **Project Settings → API**: copy the Project URL and the publishable
   (`anon`) key into `CONFIG.supabase` in `assets/shared-data.js`.

The anon key is meant to be public. The rules in `schema.sql` protect the
data. Never paste the `service_role` key into the site.

## Live Audiomack + YouTube numbers (optional)

```powershell
supabase functions deploy stats --no-verify-jwt
supabase secrets set YOUTUBE_API_KEY="your-key"
supabase secrets set YOUTUBE_CHANNEL_ID="UCxxxxxxxx"
supabase secrets set AUDIOMACK_ARTIST="tobiis_simon"
```

Then set `liveEndpoint` in `CONFIG`. Until then, every number is typed in from
admin → Numbers.

## Visitor statistics

Admin → Overview shows unique visitors, page views, average time on site,
booking clicks and mailing-list size. **No cookies, no IP addresses, no
personal data**, so no cookie banner is needed. The figures are indicative
(ad blockers miss some visits), so they're good for spotting trends, not for
contracts.

## A note on `SQL security.txt`

If you keep a scratch file with database passwords in this folder, keep it named
exactly `SQL security.txt`. It's in `.gitignore`. Better still, move the
password to a password manager and delete the file.

## Changing the look

Colours, fonts, radius and glass live at the top of `assets/shared.css`:

```css
--gold:#D9A45B;     /* the one accent */
--gold-hi:#F0C27F;  /* numbers, hover */
--ink:#0B0A09;      /* page background */
```
