import { githubFetch } from "@/lib/github";

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    } | null;
    message: string;
  };
  author: {
    login: string;
  } | null;
}

export async function getRecentCommits(
  owner: string,
  repo: string,
  branch: string,
  accessToken: string
) {
  const commits = await githubFetch<GitHubCommit[]>(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
      branch
    )}&per_page=100`,
    accessToken
  );

  return commits;
}