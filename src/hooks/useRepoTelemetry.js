import { useEffect, useState } from "react";
import { fetchUserRepos, formatRepoData } from "../services/githubAPI";

const CACHE_KEY = "hmd:repos";
const CACHE_TTL_MS = 30 * 60 * 1000;

// Storage can throw (private mode, blocked site data), so both helpers treat
// any failure as a cache miss.
function readCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.repos : null;
  } catch {
    return null;
  }
}

function writeCache(repos) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos }));
  } catch {
    /* non-essential */
  }
}

// Live GitHub data keyed by lower-cased repo name. Curated copy always renders
// first; this only fills in repo links and readouts when it arrives. Failing
// (rate limit, offline) just leaves those readouts out — the unauthenticated
// API allows 60 requests an hour, hence the session cache.
export function useRepoTelemetry(username) {
  const [repos, setRepos] = useState(readCache);

  useEffect(() => {
    if (repos) return;
    let cancelled = false;
    fetchUserRepos(username)
      .then((data) => {
        const byName = Object.fromEntries(
          data.map(formatRepoData).map((repo) => [repo.name.toLowerCase(), repo])
        );
        writeCache(byName);
        if (!cancelled) setRepos(byName);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username, repos]);

  return repos;
}
