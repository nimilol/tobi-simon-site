# Tobi Simon — Artist Profile

A one-page artist CV. Shows streaming performance, discography, a vertical video
carousel, achievements, "My Story" photos and "My Voice" clips, and tour history —
kept current from a separate owner dashboard (`admin.html`) rather than a panel
bolted onto the public page.

```
tobi-simon-site/
├─ index.html              ← the public site (read-only)
├─ admin.html              ← owner login + dashboard (separate page, not linked from search)
├─ assets/
│  ├─ shared-data.js       ← CONFIG, DEFAULTS and data helpers — imported by both pages
│  ├─ shared.css           ← tokens + form components shared by both pages
│  └─ tobi-hero.jpg        ← add the portrait here (4:5 works best)
├─ supabase/
│  ├─ schema.sql           ← run once in Supabase (site content table + media storage bucket)
│  └─ functions/stats/     ← fetches live Audiomack + YouTube numbers
└─ README.md
```

The owner login used to live behind a button on the public page. It's now its
own page, `admin.html`, so the public site stays clean. It isn't linked from
anywhere public and is marked `noindex` — bookmark it directly. The real
protection isn't obscurity, it's that only your one Supabase account can
write (see Step 2).

---

## Which numbers update on their own?

| Platform | How it updates | Why |
|---|---|---|
| **Audiomack** | Automatic | Public API is open to read |
| **YouTube Music** | Automatic | Official Data API, free tier |
| **Spotify** | Typed in by Tobi | Spotify does not publish monthly listeners to outside apps |
| **Apple Music** | Typed in by Tobi | Apple publishes no play counts at all |
| **Boomplay** | Typed in by Tobi | No public API |

Manual is not a downgrade. A number Tobi copies from his own dashboard is the
same number a label would see — it just needs a refresh now and then.

---

## Run it locally

Open `index.html` in a browser. That's it — no build step, no install.
To see it on a proper local server (PowerShell, from the project folder):

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`.

**Owner login** is at `http://localhost:8000/admin.html`. `CONFIG.supabase.enabled`
in `assets/shared-data.js` is already `true`, pointed at a real Supabase project —
so login only works once you've completed Step 2 below (run `schema.sql`, create
the one owner account). Set `enabled: false` there if you want demo mode
(any email, password `demo`) while you're just looking at layout.

---

## Step 1 — Put it live for free

Sign in to GitHub, create a new **empty public** repo called `tobi-simon-site`
(no README, no .gitignore — the folder already has them).

Then, in PowerShell, from inside the project folder:

```powershell
git init
git add .
git commit -m "Artist profile page"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/tobi-simon-site.git
git push -u origin main
```

> Note: on Mac/Linux tutorials you'll see commands chained with `&&`.
> PowerShell rejects that — use `;` or separate lines, as above.

Now turn on hosting: repo → **Settings** → **Pages** → Source: `main`, folder `/ (root)` → **Save**.

Your site appears at `https://YOUR-USERNAME.github.io/tobi-simon-site/` in about a minute.

**To update the site later:**

```powershell
git add .
git commit -m "Describe what changed"
git push
```

---

## Step 2 — Real login and saving (Supabase, free tier)

1. Create a project at supabase.com.
2. **SQL Editor** → paste `supabase/schema.sql` → **Run**. This creates the
   `site_content` table *and* the `media` storage bucket (with policies) that
   `admin.html` uploads "My Story" photos and "My Voice" videos into.
3. **Authentication → Users → Add user** — create ONE account for Tobi.
4. **Authentication → Sign In / Providers → Email** — turn *off*
   "Allow new users to sign up". This is what stops strangers making accounts.
5. **Project Settings → API** — copy the Project URL and the `anon` key.
6. Open `assets/shared-data.js`, find the `CONFIG` block near the top, and fill in:

```js
supabase: {
  enabled: true,
  url:     'https://xxxxxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...'
}
```

Both `index.html` and `admin.html` import this same file, so it only needs
setting once. The `anon` key is **meant** to be public — the database rules
in `schema.sql` are what actually protect the data. Never paste the
`service_role` key here, and never commit a file containing your database
password (see the note on `SQL security.txt` below).

Push the change and the login is real.

---

## Step 3 — Live Audiomack + YouTube numbers

Install the Supabase CLI, then from the project folder:

```powershell
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy stats --no-verify-jwt
supabase secrets set YOUTUBE_API_KEY="your-key"
supabase secrets set YOUTUBE_CHANNEL_ID="UCxxxxxxxx"
supabase secrets set AUDIOMACK_ARTIST="tobisimon"
```

Get the YouTube key from Google Cloud Console → enable **YouTube Data API v3** →
Credentials → Create API key.

Then set the endpoint in `CONFIG`:

```js
liveEndpoint: 'https://xxxxxxxx.supabase.co/functions/v1/stats'
```

If this endpoint is ever unreachable, the page quietly falls back to the last
saved numbers. It never shows a broken stat to a visitor.

---

## Before sending the link to a label

- [ ] Portrait added at `assets/tobi-hero.jpg`
- [ ] Every `PLACEHOLDER` replaced with real content
- [ ] Real profile URLs on all five platforms (`DATA.platforms[].url`)
- [ ] Real booking email in `DATA.profile.email`
- [ ] Public sign-ups turned off in Supabase
- [ ] Opened on a phone to check it reads well

---

## Visitor statistics

The dashboard shows unique visitors, total page views, average time on site,
and how many people clicked through to email. To switch it on, re-run
`supabase/schema.sql` (the whole file is safe to run again) — the
**VISITOR STATS** block at the end creates the `site_events` table and the
`get_site_stats()` function. Until you do, the Visitors panel just says it
isn't set up yet.

What is stored: an event type, a random per-tab id, and a duration in seconds.
**No cookies, no IP addresses, no personal data**, so there is nothing here
that needs a cookie banner. Visitors can only *append* events — reading the
numbers requires being signed in as you.

One honest limitation: because the counting happens in the visitor's browser,
the figures are indicative rather than audit-grade. Ad blockers will miss some
visits, and someone determined could inflate them. Fine for knowing whether a
label opened your page; not something to quote in a contract.

---

## A note on `SQL security.txt`

If you keep a scratch file with your Supabase database password or login in
this folder, keep it named exactly `SQL security.txt` — it's already listed
in `.gitignore` so a `git add .` can't sweep it into a commit. Better still:
delete it once the password is saved somewhere like a password manager, and
if it was ever committed or shared, rotate the database password from the
Supabase dashboard (**Project Settings → Database**).

---

## Changing the look

Colours, fonts and spacing tokens live in `assets/shared.css` under `:root` —
shared by both `index.html` and `admin.html`. Change one value there and it
updates everywhere on both pages.

```css
--cognac: #B8763E;   /* the main brown accent */
--brass:  #E0A868;   /* the bright brown used on numbers */
```
