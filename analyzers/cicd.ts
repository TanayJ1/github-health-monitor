import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeCICD(files: RepositoryFile[]): Finding[] {
  const findings: Finding[] = [];

  const workflowFiles = files.filter((file) => {
    const path = file.path.toLowerCase();

    return (
      path.startsWith(".github/workflows/") &&
      (path.endsWith(".yml") || path.endsWith(".yaml"))
    );
  });

  if (workflowFiles.length === 0) {
    findings.push({
      category: "CICD",
      severity: "MEDIUM",
      title: "No CI/CD workflow detected",
      description:
        "No GitHub Actions workflow files were found in .github/workflows/.",
      rule: "CI_CD_MISSING",
      recommendation:
        "Add a GitHub Actions workflow to automate testing, linting, builds, and deployments.",
    });

    return findings;
  }

  findings.push({
    category: "CICD",
    severity: "INFO",
    title: "CI/CD workflows detected",
    description:
      `${workflowFiles.length} GitHub Actions workflow file(s) were detected.`,
    rule: "CI_CD_DETECTED",
    recommendation:
      "Continue maintaining automated CI/CD workflows and monitor their reliability.",
  });

  const workflowNames = workflowFiles.map((file) => {
    const parts = file.path.split("/");
    return parts[parts.length - 1];
  });

  const hasTestWorkflow = workflowNames.some((name) => {
    const lower = name.toLowerCase();

    return (
      lower.includes("test") ||
      lower.includes("ci") ||
      lower.includes("build")
    );
  });

  if (!hasTestWorkflow) {
    findings.push({
      category: "CICD",
      severity: "LOW",
      title: "No obvious test or build workflow detected",
      description:
        "GitHub Actions workflows exist, but their filenames do not clearly indicate a test, CI, or build workflow.",
      rule: "CI_TEST_WORKFLOW_MISSING",
      recommendation:
        "Consider adding a dedicated workflow for automated testing and build validation.",
    });
  }

  return findings;
}