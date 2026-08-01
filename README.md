# Tobi Simon — Artist Profile

A one-page artist CV. Shows streaming performance, discography, achievements and
tour history, with a private admin panel for the owner to keep it current.

```
tobi-simon-site/
├─ index.html              ← the whole public site
├─ assets/
│  └─ tobi-hero.jpg        ← add the portrait here (4:5 works best)
├─ supabase/
│  ├─ schema.sql           ← run once in Supabase
│  └─ functions/stats/     ← fetches live Audiomack + YouTube numbers
└─ README.md
```

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

**Owner login in demo mode:** any email, password `demo`.

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
2. **SQL Editor** → paste `supabase/schema.sql` → **Run**.
3. **Authentication → Users → Add user** — create ONE account for Tobi.
4. **Authentication → Sign In / Providers → Email** — turn *off*
   "Allow new users to sign up". This is what stops strangers making accounts.
5. **Project Settings → API** — copy the Project URL and the `anon` key.
6. Open `index.html`, find the `CONFIG` block near the bottom, and fill in:

```js
supabase: {
  url:     'https://xxxxxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...'
}
```

The `anon` key is **meant** to be public — the database rules in `schema.sql`
are what actually protect the data. Never paste the `service_role` key here.

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

## Changing the look

All colours are at the very top of `index.html` under `:root`. Change one value
there and it updates everywhere on the page — no need to hunt through the file.

```css
--cognac: #B8763E;   /* the main brown accent */
--brass:  #E0A868;   /* the bright brown used on numbers */
```
