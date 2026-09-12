import { githubFetch } from "@/lib/github";

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export async function getGitHubFileContent(
  owner: string,
  repo: string,
  path: string,
  token: string
): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    console.error(
      `Failed to fetch GitHub file ${path}:`,
      response.status
    );

    return null;
  }

  return await response.text();
}

export async function getRepositoryFiles(
  owner: string,
  repo: string,
  branch: string,
  accessToken: string
) {
  const encodedBranch = encodeURIComponent(branch);

  const tree = await githubFetch<GitHubTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${encodedBranch}?recursive=1`,
    accessToken
  );

  return tree.tree.map((item) => ({
  path: item.path,
  type: (item.type === "tree" ? "dir" : "file") as "file" | "dir",
}));
}