import { Finding } from "@/types/finding";

interface CommitData {
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

export function analyzeGitActivity(
  commits: CommitData[]
): Finding[] {
  const findings: Finding[] = [];

  if (commits.length === 0) {
    findings.push({
      category: "GIT_ACTIVITY",
      severity: "HIGH",
      title: "No recent commits detected",
      description:
        "No commits were found for the repository's default branch.",
      rule: "NO_COMMITS",
      recommendation:
        "Review the repository history and ensure development activity is being tracked.",
    });

    return findings;
  }

  const uniqueContributors = new Set(
    commits
      .map((commit) => commit.author?.login)
      .filter(Boolean)
  );

  const latestCommitDate = commits[0]?.commit.author?.date;

  if (latestCommitDate) {
    const latestCommit = new Date(latestCommitDate);
    const now = new Date();

    const daysSinceLastCommit =
      (now.getTime() - latestCommit.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysSinceLastCommit > 90) {
      findings.push({
        category: "GIT_ACTIVITY",
        severity: "HIGH",
        title: "Repository appears inactive",
        description:
          `No commit activity has been detected for approximately ${Math.floor(
            daysSinceLastCommit
          )} days.`,
        rule: "REPOSITORY_INACTIVE",
        recommendation:
          "Review the repository's maintenance status and consider documenting whether it is actively maintained.",
      });
    } else if (daysSinceLastCommit > 30) {
      findings.push({
        category: "GIT_ACTIVITY",
        severity: "MEDIUM",
        title: "Low recent repository activity",
        description:
          `The latest commit was approximately ${Math.floor(
            daysSinceLastCommit
          )} days ago.`,
        rule: "LOW_RECENT_ACTIVITY",
        recommendation:
          "Review whether the repository is still actively maintained and establish a regular development cadence if necessary.",
      });
    }
  }

  if (uniqueContributors.size === 1 && commits.length >= 10) {
    findings.push({
      category: "GIT_ACTIVITY",
      severity: "LOW",
      title: "Repository has a single active contributor",
      description:
        "Recent commit history indicates that development activity is concentrated around one contributor.",
      rule: "SINGLE_CONTRIBUTOR",
      recommendation:
        "Consider adding code review or additional contributors to reduce single-person ownership risk.",
    });
  }

  findings.push({
    category: "GIT_ACTIVITY",
    severity: "INFO",
    title: "Git activity analyzed",
    description:
      `${commits.length} recent commits from ${uniqueContributors.size} contributor(s) were analyzed.`,
    rule: "GIT_ACTIVITY_ANALYZED",
    recommendation:
      "Continue monitoring repository activity and contributor distribution over time.",
  });

  return findings;
}