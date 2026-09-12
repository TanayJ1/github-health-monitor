import { Finding } from "@/types/finding";
import { DependabotAlert } from "@/services/githubDependabot";

function mapSeverity(
  severity: string
): Finding["severity"] {
  switch (severity.toLowerCase()) {
    case "critical":
      return "CRITICAL";

    case "high":
      return "HIGH";

    case "medium":
      return "MEDIUM";

    case "low":
      return "LOW";

    default:
      return "INFO";
  }
}

export function analyzeDependencies(
  files: { path: string }[],
  alerts: DependabotAlert[]
): Finding[] {
  const findings: Finding[] = [];

  /*
   * Existing dependency detection
   */

  const dependencyFiles = files.filter((file) => {
    const path = file.path.toLowerCase();

    return (
      path.endsWith("package.json") ||
      path.endsWith("requirements.txt") ||
      path.endsWith("pyproject.toml") ||
      path.endsWith("pom.xml") ||
      path.endsWith("go.mod") ||
      path.endsWith("cargo.toml")
    );
  });

  if (dependencyFiles.length === 0) {
    findings.push({
      category: "DEPENDENCY",
      severity: "INFO",
      title: "No dependency manifest detected",
      description:
        "No supported dependency manifest was detected in the repository.",
      recommendation:
        "Add a dependency manifest so dependencies can be analyzed.",
    });
  } else {
    findings.push({
      category: "DEPENDENCY",
      severity: "INFO",
      title: "Dependency files detected",
      description: `${dependencyFiles.length} dependency manifest file(s) detected.`,
      recommendation:
        "Keep dependency versions updated and regularly review security advisories.",
    });
  }

  /*
   * Real vulnerability findings
   */

  for (const alert of alerts) {
    const vulnerability = alert.security_vulnerability;
    const advisory = alert.security_advisory;

    if (!vulnerability) {
      continue;
    }

    const packageName = vulnerability.package.name;
    const severity = mapSeverity(vulnerability.severity);

    const cve = advisory?.cve_id;
    const ghsa = advisory?.ghsa_id;

    const identifiers = [cve, ghsa]
      .filter(Boolean)
      .join(" / ");

    const patchedVersion =
      vulnerability.first_patched_version?.identifier;

    findings.push({
      category: "DEPENDENCY",
      severity,

      title: `Vulnerable dependency: ${packageName}`,

      description:
        advisory?.summary ||
        `${packageName} has a known security vulnerability.`,

      file: alert.dependency.manifest_path,

      rule: identifiers || "DEPENDENCY_VULNERABILITY",

      recommendation: patchedVersion
        ? `Update ${packageName} to version ${patchedVersion} or later.`
        : `Update ${packageName} to a secure version and review the associated security advisory.`,
    });
  }

  return findings;
}