export interface DependabotAlert {
  number: number;
  state: string;

  dependency: {
    package: {
      ecosystem: string;
      name: string;
    };
    manifest_path: string;
    scope: string;
  };

  security_advisory: {
    ghsa_id: string | null;
    cve_id: string | null;
    summary: string;
    description: string;
    severity: string;
    cvss?: {
      score: number | null;
    } | null;
  } | null;

  security_vulnerability: {
    package: {
      ecosystem: string;
      name: string;
    };
    severity: string;
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    } | null;
  } | null;

  html_url: string;
}

export async function getDependabotAlerts(
  owner: string,
  repo: string,
  token: string
): Promise<DependabotAlert[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    const text = await response.text();

    console.error(
      "Failed to fetch Dependabot alerts:",
      response.status,
      text
    );

    throw new Error(
      `Dependabot API failed with status ${response.status}`
    );
  }

  return response.json();
}