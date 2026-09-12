import { Finding } from "@/types/finding";

interface PullRequestData {
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

export function analyzePullRequests(
  pullRequests: PullRequestData[]
): Finding[] {
  const findings: Finding[] = [];

  const openPRs = pullRequests.filter(
    (pr) => pr.state === "open"
  );

  const mergedPRs = pullRequests.filter(
    (pr) => pr.merged_at !== null
  );

  if (pullRequests.length === 0) {
    findings.push({
      category: "PULL_REQUEST",
      severity: "INFO",
      title: "No pull request activity detected",
      description:
        "No pull requests were found in the repository.",
      rule: "NO_PR_ACTIVITY",
      recommendation:
        "Consider using pull requests and code review for important changes.",
    });

    return findings;
  }

  if (openPRs.length >= 10) {
    findings.push({
      category: "PULL_REQUEST",
      severity: "HIGH",
      title: "Large number of open pull requests",
      description:
        `${openPRs.length} pull requests are currently open.`,
      rule: "TOO_MANY_OPEN_PRS",
      recommendation:
        "Review and prioritize open pull requests to prevent work from becoming stale.",
    });
  } else if (openPRs.length >= 5) {
    findings.push({
      category: "PULL_REQUEST",
      severity: "MEDIUM",
      title: "Several pull requests are currently open",
      description:
        `${openPRs.length} pull requests are currently open.`,
      rule: "MANY_OPEN_PRS",
      recommendation:
        "Review open pull requests regularly and prioritize older changes.",
    });
  }

  const now = new Date();

  const stalePRs = openPRs.filter((pr) => {
    const created = new Date(pr.created_at);

    const ageInDays =
      (now.getTime() - created.getTime()) /
      (1000 * 60 * 60 * 24);

    return ageInDays > 30;
  });

  if (stalePRs.length > 0) {
    findings.push({
      category: "PULL_REQUEST",
      severity: "MEDIUM",
      title: "Stale pull requests detected",
      description:
        `${stalePRs.length} open pull request(s) have been open for more than 30 days.`,
      rule: "STALE_PRS",
      recommendation:
        "Review stale pull requests and either merge, update, or close them.",
    });
  }

  findings.push({
    category: "PULL_REQUEST",
    severity: "INFO",
    title: "Pull request activity analyzed",
    description:
      `${pullRequests.length} pull request(s) analyzed, including ${openPRs.length} open and ${mergedPRs.length} merged.`,
    rule: "PR_ACTIVITY_ANALYZED",
    recommendation:
      "Continue monitoring pull request volume, review time, and stale changes.",
  });

  return findings;
}