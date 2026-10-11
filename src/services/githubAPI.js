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
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=100`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    // Filter out forks if you only want original repos
    // return repos.filter(repo => !repo.fork);

    // sort=updated already returns the most recent first.
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    throw error;
  }
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
