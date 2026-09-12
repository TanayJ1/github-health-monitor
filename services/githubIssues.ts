import { githubFetch } from "@/lib/github";

interface GitHubIssue {
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: {
    login: string;
  };
  pull_request?: {
    url: string;
  };
}

export async function getIssues(
  owner: string,
  repo: string,
  accessToken: string
) {
  const issues = await githubFetch<GitHubIssue[]>(
    `/repos/${owner}/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`,
    accessToken
  );

  // GitHub's Issues API also returns pull requests.
  // Remove those because PRs are analyzed separately.
  return issues.filter((issue) => !issue.pull_request);
}