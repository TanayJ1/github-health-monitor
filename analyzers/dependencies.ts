import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeDependencies(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

  const paths = files.map((file) => file.path.toLowerCase());

  const dependencyFiles = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "pom.xml",
    "go.mod",
    "cargo.toml",
  ];

  const foundDependencyFiles = dependencyFiles.filter((file) =>
    paths.includes(file)
  );

  if (foundDependencyFiles.length === 0) {
    findings.push({
      category: "DEPENDENCY",
      severity: "INFO",
      title: "No supported dependency manifest detected",
      description:
        "The repository does not contain a recognized dependency manifest.",
      rule: "DEPENDENCY_MANIFEST_MISSING",
      recommendation:
        "Add a standard dependency manifest for the project's programming ecosystem.",
    });

    return findings;
  }

  if (foundDependencyFiles.length > 1) {
    findings.push({
      category: "DEPENDENCY",
      severity: "INFO",
      title: "Multiple dependency ecosystems detected",
      description:
        `The repository contains multiple dependency manifests: ${foundDependencyFiles.join(", ")}.`,
      rule: "MULTIPLE_DEPENDENCY_MANIFESTS",
      recommendation:
        "Ensure dependencies for each ecosystem are intentionally maintained and consistently updated.",
    });
  }

  return findings;
}