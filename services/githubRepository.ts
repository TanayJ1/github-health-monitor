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