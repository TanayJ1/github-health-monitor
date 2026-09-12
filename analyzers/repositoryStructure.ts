import { Finding } from "@/types/finding";

export interface RepositoryFile {
  path: string;
  type: "file" | "dir";
}

export function analyzeRepositoryStructure(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

//   const hasTests = files.some(
//     (file) =>
//       file.path.startsWith("tests/") ||
//       file.path.startsWith("__tests__/") ||
//       file.path.includes(".test.") ||
//       file.path.includes(".spec.")
//   );

  const hasReadme = files.some(
    (file) =>
      file.path.toLowerCase() === "readme.md"
  );

  const hasGitignore = files.some(
    (file) =>
      file.path === ".gitignore"
  );

  if (!hasReadme) {
    findings.push({
      category: "DOCUMENTATION",
      severity: "MEDIUM",
      title: "README file is missing",
      description:
        "The repository does not contain a README.md file.",
      rule: "README_MISSING",
      recommendation:
        "Add a README explaining the project, installation steps, configuration, and usage.",
    });
  }

  if (!hasGitignore) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "MEDIUM",
      title: ".gitignore file is missing",
      description:
        "The repository does not contain a .gitignore file.",
      rule: "GITIGNORE_MISSING",
      recommendation:
        "Add a .gitignore file to prevent generated files, secrets, dependencies, and local configuration from being committed.",
    });
  }

//   if (!hasTests) {
//     findings.push({
//       category: "TESTING",
//       severity: "HIGH",
//       title: "No test files detected",
//       description:
//         "No obvious test directories or test files were found in the repository.",
//       rule: "TESTS_MISSING",
//       recommendation:
//         "Add automated tests for important application logic and critical workflows.",
//     });
//   }

  return findings;
}