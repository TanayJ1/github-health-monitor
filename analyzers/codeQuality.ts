import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeCodeQuality(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

  const paths = files.map((file) => file.path.toLowerCase());

  // --------------------------------------------------
  // Check 1: package.json without a lock file
  // --------------------------------------------------

  const hasPackageJson = paths.includes("package.json");

  const lockFiles = [
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
    "bun.lock",
  ];

  const foundLockFiles = lockFiles.filter((file) =>
    paths.includes(file)
  );

  if (hasPackageJson && foundLockFiles.length === 0) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "LOW",
      title: "Package manager lock file is missing",
      description:
        "package.json was detected, but no recognized package manager lock file was found.",
      rule: "LOCKFILE_MISSING",
      recommendation:
        "Commit the appropriate lock file to ensure reproducible dependency installation.",
    });
  }

  // --------------------------------------------------
  // Check 2: Multiple lock files
  // --------------------------------------------------

  if (foundLockFiles.length > 1) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "LOW",
      title: "Multiple package manager lock files detected",
      description:
        `Multiple lock files were detected: ${foundLockFiles.join(", ")}.`,
      rule: "MULTIPLE_LOCKFILES",
      recommendation:
        "Use one package manager consistently unless multiple ecosystems are intentionally required.",
    });
  }

  // --------------------------------------------------
  // Check 3: node_modules committed
  // --------------------------------------------------

  const hasNodeModules = files.some((file) => {
    const path = file.path.toLowerCase();

    return (
      path.startsWith("node_modules/") ||
      path.includes("/node_modules/")
    );
  });

  if (hasNodeModules) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "HIGH",
      title: "node_modules directory is committed",
      description:
        "The repository appears to contain the node_modules directory.",
      rule: "NODE_MODULES_COMMITTED",
      recommendation:
        "Remove node_modules from version control and add it to .gitignore.",
    });
  }

  // --------------------------------------------------
  // Check 4: Build output committed
  // --------------------------------------------------

  const generatedDirectories = [
    ".next/",
    "dist/",
    "build/",
    "coverage/",
  ];

  const generatedDirectoriesFound = generatedDirectories.filter(
    (directory) =>
      paths.some((path) => path.startsWith(directory))
  );

  if (generatedDirectoriesFound.length > 0) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "LOW",
      title: "Generated build artifacts detected",
      description:
        `Generated directories were detected: ${generatedDirectoriesFound.join(
          ", "
        )}.`,
      rule: "GENERATED_ARTIFACTS_COMMITTED",
      recommendation:
        "Avoid committing generated build artifacts unless the project specifically requires them.",
    });
  }

  // --------------------------------------------------
  // Check 5: Repository contains source files
  // --------------------------------------------------

  const sourceExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".cpp",
    ".c",
    ".go",
    ".rs",
  ];

  const sourceFiles = files.filter((file) =>
    sourceExtensions.some((extension) =>
      file.path.toLowerCase().endsWith(extension)
    )
  );

  if (sourceFiles.length === 0) {
    findings.push({
      category: "CODE_QUALITY",
      severity: "MEDIUM",
      title: "No recognizable source files detected",
      description:
        "No common source-code file extensions were detected in the repository.",
      rule: "SOURCE_FILES_MISSING",
      recommendation:
        "Verify that the repository contains the application's source code.",
    });
  } else {
    findings.push({
      category: "CODE_QUALITY",
      severity: "INFO",
      title: "Source code detected",
      description:
        `${sourceFiles.length} source file(s) were detected in the repository.`,
      rule: "SOURCE_FILES_DETECTED",
      recommendation:
        "Continue maintaining clear project structure and consistent coding practices.",
    });
  }

  return findings;
}