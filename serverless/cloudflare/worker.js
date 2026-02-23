export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders() });
      }

      if (url.pathname !== "/dates") {
        return json({ error: "Not Found" }, 404);
      }

      if (request.method === "GET") {
        const dates = await readDates(env);
        return json({ dates }, 200);
      }

      if (request.method === "PUT") {
        if (!authorized(request, env)) {
          return json({ error: "Unauthorized" }, 401);
        }

        let payload;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Bad JSON" }, 400);
        }

        if (!payload || !Array.isArray(payload.dates)) {
          return json({ error: "Invalid payload" }, 400);
        }

        const dates = normalizeDates(payload.dates);
        await writeDates(env, dates);
        return json({ ok: true, dates }, 200);
      }

      return json({ error: "Method Not Allowed" }, 405);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal Error";
      return json({ error: message }, 500);
    }
  },
};

function authorized(request, env) {
  const key = request.headers.get("x-sync-key") || "";
  return Boolean(env.SYNC_KEY) && key === env.SYNC_KEY;
}

function normalizeDates(dates) {
  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  const set = new Set();
  for (const d of dates) {
    if (typeof d === "string" && ymd.test(d) && isValidYMD(d)) set.add(d);
  }
  return Array.from(set).sort();
}

function isValidYMD(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return false;
  const idx = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const check = new Date(idx * 86400000);
  const yy = check.getUTCFullYear();
  const mm = String(check.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(check.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}` === ymd;
}

async function readDates(env) {
  const { owner, repo, path, branch } = envTarget(env);
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

  const resp = await fetch(api, {
    headers: githubHeaders(env),
  });

  if (resp.status === 404) return [];
  if (!resp.ok) throw new Error(`GitHub read failed: ${resp.status}`);

  const file = await resp.json();
  const content = decodeBase64(file.content || "");

  try {
    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.dates)) return [];
    return normalizeDates(parsed.dates);
  } catch {
    return [];
  }
}

async function writeDates(env, dates) {
  const { owner, repo, path, branch } = envTarget(env);
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  let sha = undefined;
  const current = await fetch(`${api}?ref=${branch}`, { headers: githubHeaders(env) });
  if (current.ok) {
    const file = await current.json();
    sha = file.sha;
  }

  const content = encodeBase64(JSON.stringify({ dates }, null, 2));
  const body = {
    message: "chore: update meet-days data",
    content,
    branch,
    sha,
  };

  const resp = await fetch(api, {
    method: "PUT",
    headers: githubHeaders(env),
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub write failed: ${resp.status} ${text}`);
  }
}

function envTarget(env) {
  return {
    owner: env.GH_OWNER,
    repo: env.GH_REPO,
    path: env.GH_FILE_PATH || "data/meet-days.json",
    branch: env.GH_BRANCH || "main",
  };
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "meet-days-sync-worker",
  };
}

function encodeBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64(str) {
  return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,x-sync-key",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
