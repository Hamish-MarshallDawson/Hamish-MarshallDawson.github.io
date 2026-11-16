/**
 * GitHub API Service
 * Fetches public repositories for a given username
 */

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Fetches all public repositories for a GitHub user
 * @param {string} username - GitHub username
 * @returns {Promise<Array>} - Array of repository objects
 */
export const fetchUserRepos = async (username) => {
  // Asking for the rate limit is free and never fails with 403, so a spent quota (60 an hour per IP,
  // easily used up on a shared network) skips the call instead of logging a failed request.
  const limit = await fetch(`${GITHUB_API_BASE}/rate_limit`);
  if (limit.ok) {
    const { resources } = await limit.json();
    if (resources?.core?.remaining === 0) throw new Error("GitHub API rate limit reached");
  }

  const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=100`);
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  // sort=updated already returns the most recent first.
  return response.json();
};

/**
 * Format repository data for display
 * @param {Object} repo - Raw repository object from GitHub API
 * @returns {Object} - Formatted repository data
 */
export const formatRepoData = (repo) => {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description || "No description available",
    url: repo.html_url,
    homepage: repo.homepage,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    updatedAt: new Date(repo.updated_at).toLocaleDateString(),
    createdAt: new Date(repo.created_at).toLocaleDateString(),
    pushedAt: repo.pushed_at,
    topics: repo.topics || [],
    isFork: repo.fork,
  };
};
