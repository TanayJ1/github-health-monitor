import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeSecurity(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

  for (const file of files) {
    const path = file.path.toLowerCase();

    // Environment files
    if (
      path === ".env" ||
      path === ".env.local" ||
      path === ".env.production" ||
      path === ".env.development"
    ) {
      findings.push({
        category: "SECURITY",
        severity: "HIGH",
        title: "Environment file may contain secrets",
        description:
          `The repository contains ${file.path}, which commonly contains sensitive credentials or configuration.`,
        file: file.path,
        rule: "ENV_FILE_COMMITTED",
        recommendation:
          "Remove sensitive environment files from version control and store secrets using environment variables or a secret manager.",
      });
    }

    // Private keys
    if (
      path.endsWith(".pem") ||
      path.endsWith(".key") ||
      path.includes("private_key")
    ) {
      findings.push({
        category: "SECURITY",
        severity: "CRITICAL",
        title: "Potential private key detected",
        description:
          "A file with a private-key related extension or name was detected in the repository.",
        file: file.path,
        rule: "PRIVATE_KEY_FILE",
        recommendation:
          "Remove private keys from the repository, rotate the exposed key, and store credentials securely outside source control.",
      });
    }

    // Credential-related filenames
    if (
      path.includes("credentials") ||
      path.includes("secret") ||
      path.includes("password")
    ) {
      findings.push({
        category: "SECURITY",
        severity: "HIGH",
        title: "Potential credential file detected",
        description:
          "The filename suggests that it may contain credentials or other sensitive information.",
        file: file.path,
        rule: "CREDENTIAL_FILE",
        recommendation:
          "Review the file and remove sensitive credentials from source control. Use environment variables or a secret manager instead.",
      });
    }
  }

  return findings;
}