const GITHUB_API_URL = "https://api.github.com";

export async function githubFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(
    `${GITHUB_API_URL}${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `GitHub API error ${response.status}: ${errorText}`
    );
  }

  return response.json();
}