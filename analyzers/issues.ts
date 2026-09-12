import { Finding } from "@/types/finding";

interface IssueData {
  number: number;
  title: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: {
    login: string;
  };
}

export function analyzeIssues(
  issues: IssueData[]
): Finding[] {
  const findings: Finding[] = [];

  if (issues.length === 0) {
    findings.push({
      category: "ISSUE",
      severity: "INFO",
      title: "No issue activity detected",
      description:
        "No GitHub issues were found in the repository.",
      rule: "NO_ISSUE_ACTIVITY",
      recommendation:
        "Consider using issues to track bugs, feature requests, and technical tasks.",
    });

    return findings;
  }

  const openIssues = issues.filter(
    (issue) => issue.state === "open"
  );

  if (openIssues.length >= 20) {
    findings.push({
      category: "ISSUE",
      severity: "HIGH",
      title: "Large number of open issues",
      description:
        `${openIssues.length} issues are currently open.`,
      rule: "TOO_MANY_OPEN_ISSUES",
      recommendation:
        "Review and prioritize open issues regularly to prevent unresolved work from accumulating.",
    });
  } else if (openIssues.length >= 10) {
    findings.push({
      category: "ISSUE",
      severity: "MEDIUM",
      title: "Many open issues detected",
      description:
        `${openIssues.length} issues are currently open.`,
      rule: "MANY_OPEN_ISSUES",
      recommendation:
        "Review open issues and prioritize the most important bugs and feature requests.",
    });
  }

  const now = new Date();

  const staleIssues = openIssues.filter((issue) => {
    const updated = new Date(issue.updated_at);

    const ageInDays =
      (now.getTime() - updated.getTime()) /
      (1000 * 60 * 60 * 24);

    return ageInDays > 30;
  });

  if (staleIssues.length > 0) {
    findings.push({
      category: "ISSUE",
      severity: "MEDIUM",
      title: "Stale issues detected",
      description:
        `${staleIssues.length} open issue(s) have not been updated for more than 30 days.`,
      rule: "STALE_ISSUES",
      recommendation:
        "Review stale issues and close, prioritize, or update them.",
    });
  }

  findings.push({
    category: "ISSUE",
    severity: "INFO",
    title: "Issue activity analyzed",
    description:
      `${issues.length} issue(s) analyzed, including ${openIssues.length} open.`,
    rule: "ISSUE_ACTIVITY_ANALYZED",
    recommendation:
      "Continue monitoring issue volume and issue age over time.",
  });

  return findings;
}