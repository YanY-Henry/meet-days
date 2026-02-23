# Meet Days Sync Worker (Cloudflare)

This worker reads/writes `data/meet-days.json` in your GitHub repo and acts as a safe relay.

## Why this is safer than frontend GitHub API

- GitHub token stays in Worker secrets.
- Frontend never sees `GH_TOKEN`.

## 1) Prepare GitHub token

Create a fine-grained token with repo content read/write for `meet-days`.

## 2) Configure Worker

Copy `wrangler.toml.example` to `wrangler.toml`, then set:

- `GH_OWNER`
- `GH_REPO`
- `GH_BRANCH`
- `GH_FILE_PATH` (default `data/meet-days.json`)

Set secrets:

```bash
wrangler secret put GH_TOKEN
wrangler secret put SYNC_KEY
```

## 3) Deploy

```bash
wrangler deploy
```

Assume deployed URL is:

`https://meet-days-sync.your-subdomain.workers.dev`

## 4) Configure frontend

Create `.env.local` at project root:

```bash
VITE_SYNC_ENDPOINT=https://meet-days-sync.your-subdomain.workers.dev
VITE_SYNC_KEY=your-shared-secret
```

Then build/deploy frontend as usual.

## Data format in GitHub

`data/meet-days.json`:

```json
{
  "dates": ["2026-02-14", "2026-02-23"]
}
```

## Notes

- `SYNC_KEY` is still a client-side secret. For 2-person usage, this is usually acceptable.
- If key leaks, rotate `SYNC_KEY` in Worker and both clients.
