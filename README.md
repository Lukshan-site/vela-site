# Video Site (Sinhala UI · Google Drive videos)

Personal video site built with **Next.js 16 + Supabase**. Videos live on Google Drive — admin pastes a Drive share link and the site embeds it. Visitors sign up, get a profile, and can **Like / Favorite / Comment** on videos. Liked items and Favorites each have their own page.

---

## ⚙️ One-time setup

### 1. Create a Supabase project
1. Go to https://supabase.com → **New project**.
2. Once it's ready, open **SQL Editor** → New query → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the tables, triggers, and Row Level Security policies.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon` public key
   - `service_role` secret key (server-only — never commit this)

### 2. Configure local env
```bash
cp .env.example .env.local
# fill in the three values
```

### 3. Install + run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

### 4. Make yourself admin
Sign up once at `/signup`. Then in Supabase **SQL Editor**:
```sql
update profiles set is_admin = true where username = 'your_username_here';
```
(Find your username at `/profile`.) Refresh — you'll see the **Admin** link in the nav.

### 5. Add your first video
1. Open the Drive video → right-click → **Share** → set **"Anyone with the link → Viewer"**.
2. Copy the share URL.
3. Go to `/admin/new` → paste the URL → fill in title → submit.

---

## 📦 Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com → **Import Project** → pick the repo.
3. In **Environment Variables**, paste the same three values from `.env.local`.
4. Deploy.

---

## 🗂️ Routes

| Path | Who | What |
|---|---|---|
| `/` | Anyone | Home grid of all videos |
| `/videos/[id]` | Anyone | Video player + Like / Favorite / Comments |
| `/signup`, `/login` | Anyone | Email + password auth |
| `/liked` | Signed-in | Videos this user liked |
| `/favorites` | Signed-in | Videos this user favorited |
| `/profile` | Signed-in | Your own profile (edit display name, bio, avatar) |
| `/u/[username]` | Anyone | Public profile of any user + their recent comments |
| `/admin` | Admin only | List/delete videos |
| `/admin/new` | Admin only | Add a new video (paste Drive link) |

---

## 🧱 Stack

- **Next.js 16** (App Router, React 19) on **Vercel**
- **Supabase** Postgres + Auth (email/password) — RLS enforces "users only manage their own likes/favorites/comments; only admins add videos"
- **Tailwind CSS** dark theme + **lucide-react** icons + **Noto Sans Sinhala** for clean Sinhala unicode rendering
- **Google Drive** as the actual video host — no upload pipeline needed

---

## 🔒 Security notes

- The **service-role key** lives only in `.env.local` and Vercel's env vars. Never expose it to the client.
- RLS policies in `supabase/schema.sql` mean even if someone steals the anon key, they can't insert videos, can't delete other users' comments, and can't flip the `is_admin` flag — every write is gated by `auth.uid()`.
- Drive videos with "Anyone with the link" are publicly viewable to anyone who has the file ID. Don't put private content on Drive with that setting.
