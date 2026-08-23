# Publishing My Business (client links only)

Two products live in this folder. They do not share a git remote.

| | Command Center (this folder) | `public-site/` |
|---|---|---|
| What it is | Your local software: dashboard, live client pages, Monthly reports, APIs | Only the My Business pages clients open |
| Git | Local only. Do not connect Vercel here. | Its own git repo. This is what GitHub and Vercel see. |
| When you say “push to git” | Never this root | Commit and push **inside `public-site/`** |

`public-site/` is listed in the Command Center `.gitignore`. Pushing this repo (if you ever add a private backup remote) still will not upload the Vercel site, and the Vercel repo will never contain the Command Center.

## The loop

1. **Generate reports locally** (needs your GA4 credentials in `.env.local`):

   ```bash
   npm run report:generate -- --slug=clubhaus
   # or every client, last completed month:
   npm run report:generate -- --all
   ```

2. **Preview on localhost:3001**

   - Client detail (live numbers) — unchanged, e.g. `/clients/519854014`
   - **Monthly reports** — archive + printable `/r/<token>` dashboard
   - **My Business** — snap-scroll page for the latest month, or `/b/<token>`

3. **Copy only the client pages into `public-site/`**

   ```bash
   npm run publish:my-business
   ```

   This copies an allowlist (My Business UI, report JSON, maps). It does **not** copy the dashboard, `/clients`, APIs, middleware, passwords, or keys. It does **not** commit or push.

4. **Push the public site** (only when you ask to push to git):

   ```bash
   cd public-site
   git add -A
   git commit -m "Update My Business reports"
   git push
   ```

   First time only: create a GitHub repo, `git remote add origin <url>` **from `public-site/`**, then connect that repo to Vercel.

5. **Send the live link**

   `https://<your-vercel-domain>/b/<token>`

   The publish script prints every token after it copies.

## What never goes to Vercel

- `app/page.tsx` (TV dashboard)
- `app/clients/**`, `app/api/**`, `middleware.ts`, `lib/auth.ts`
- `.env.local`, `service-account-key.json`, `.oauth-tokens.json`
- Trello, Calendar, Sheets, and other agency integrations

## First-time Vercel

1. Build and look at My Business locally until it feels right.
2. Run `npm run publish:my-business`.
3. In `public-site/`, `npm install` once, then create the GitHub repo and push.
4. Import **that** repo in Vercel. Do not import the Command Center folder.
