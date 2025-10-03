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

    const repos = await response.json();

    // Filter out forks if you only want original repos
    // return repos.filter(repo => !repo.fork);

    // Return all repos sorted by update date (most recent first)
    return repos.sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    throw error;
  }
};

/**
 * Fetches repository languages
 * @param {string} username - GitHub username
 * @param {string} repoName - Repository name
 * @returns {Promise<Object>} - Object with language stats
 */
export const fetchRepoLanguages = async (username, repoName) => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${username}/${repoName}/languages`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching repo languages:", error);
    return {};
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
    topics: repo.topics || [],
    isFork: repo.fork,
  };
};
