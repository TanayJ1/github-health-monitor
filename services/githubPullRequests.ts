import { githubFetch } from "@/lib/github";

interface GitHubPullRequest {
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
  };
}

export async function getPullRequests(
  owner: string,
  repo: string,
  accessToken: string
) {
  return githubFetch<GitHubPullRequest[]>(
    `/repos/${owner}/${repo}/pulls?state=all&per_page=100&sort=updated&direction=desc`,
    accessToken
  );
}