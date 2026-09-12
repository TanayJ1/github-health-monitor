import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeTesting(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

  const testFiles = files.filter((file) => {
    const path = file.path.toLowerCase();

    return (
      path.startsWith("tests/") ||
      path.startsWith("__tests__/") ||
      path.includes(".test.") ||
      path.includes(".spec.") ||
      path.includes("test_")
    );
  });

  const hasTestConfig = files.some((file) => {
    const path = file.path.toLowerCase();

    return (
      path === "jest.config.js" ||
      path === "jest.config.ts" ||
      path === "vitest.config.ts" ||
      path === "vitest.config.js" ||
      path === "pytest.ini" ||
      path === "tox.ini" ||
      path === "playwright.config.ts" ||
      path === "cypress.config.ts"
    );
  });

  if (testFiles.length === 0) {
    findings.push({
      category: "TESTING",
      severity: "HIGH",
      title: "No test files detected",
      description:
        "No obvious automated test files or test directories were found.",
      rule: "TESTS_MISSING",
      recommendation:
        "Add automated tests for important application logic and critical workflows.",
    });
  } else {
    findings.push({
      category: "TESTING",
      severity: "INFO",
      title: "Automated tests detected",
      description:
        `${testFiles.length} potential test file(s) were detected in the repository.`,
      rule: "TESTS_DETECTED",
      recommendation:
        "Continue maintaining tests and ensure critical application paths are covered.",
    });
  }

  if (testFiles.length > 0 && !hasTestConfig) {
    findings.push({
      category: "TESTING",
      severity: "LOW",
      title: "Test files detected without a recognized test configuration",
      description:
        "The repository contains test files, but no recognized test configuration file was detected.",
      rule: "TEST_CONFIG_MISSING",
      recommendation:
        "Consider adding an explicit test configuration appropriate for the project's testing framework.",
    });
  }

  return findings;
}