import { Finding } from "@/types/finding";

interface RepositoryFile {
  path: string;
  type: string;
}

interface SecretPattern {
  name: string;
  regex: RegExp;
  severity: Finding["severity"];
  recommendation: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: "GitHub Personal Access Token",
    regex: /github_pat_[A-Za-z0-9_]{20,}/,
    severity: "CRITICAL",
    recommendation:
      "Revoke the token immediately and move credentials to environment variables or a secrets manager.",
  },
  {
    name: "GitHub OAuth Token",
    regex: /gho_[A-Za-z0-9]{20,}/,
    severity: "CRITICAL",
    recommendation:
      "Revoke the token immediately and store credentials securely using environment variables or a secrets manager.",
  },
  {
    name: "AWS Access Key",
    regex: /AKIA[0-9A-Z]{16}/,
    severity: "CRITICAL",
    recommendation:
      "Rotate the AWS credential immediately and use environment variables or IAM roles instead of committing credentials.",
  },
  {
    name: "Google API Key",
    regex: /AIza[0-9A-Za-z_-]{35}/,
    severity: "HIGH",
    recommendation:
      "Rotate the API key and store it in an environment variable or secrets manager.",
  },
  {
    name: "Private Key",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
    severity: "CRITICAL",
    recommendation:
      "Remove the private key from the repository and rotate the associated credential immediately.",
  },
  {
    name: "JWT Token",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
    severity: "HIGH",
    recommendation:
      "Do not commit JWT credentials. Rotate the token if it is active and store secrets securely.",
  },
  {
    name: "Generic API Key",
    regex:
      /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i,
    severity: "HIGH",
    recommendation:
      "Move the API key to an environment variable or secrets manager.",
  },
  {
    name: "Generic Secret",
    regex:
      /(?:secret|password|passwd|token)\s*[:=]\s*["'][^"']{12,}["']/i,
    severity: "HIGH",
    recommendation:
      "Move sensitive credentials to environment variables or a secrets manager.",
  },
];

const SENSITIVE_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.pem$/i,
  /\.key$/i,
  /private[_-]?key/i,
  /credentials/i,
];

const SCANNABLE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".php",
  ".rb",
  ".cs",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".json",
  ".yml",
  ".yaml",
  ".xml",
  ".properties",
  ".env",
  ".ini",
  ".cfg",
  ".conf",
]);

function isSensitiveFile(path: string) {
  const filename = path.split("/").pop() || path;

  return SENSITIVE_FILE_PATTERNS.some((pattern) =>
    pattern.test(filename)
  );
}

function isScannableFile(path: string) {
  const lowerPath = path.toLowerCase();

  return Array.from(SCANNABLE_EXTENSIONS).some((extension) =>
    lowerPath.endsWith(extension)
  );
}

export function analyzeSecurity(files: RepositoryFile[]): Finding[] {
  const findings: Finding[] = [];

  /*
   * Existing filename-based security checks.
   */
  for (const file of files) {
    if (file.type !== "blob") continue;

    if (isSensitiveFile(file.path)) {
      findings.push({
        category: "SECURITY",
        severity: "HIGH",
        title: "Potential sensitive file detected",
        description: `The repository contains a potentially sensitive file: ${file.path}`,
        file: file.path,
        rule: "sensitive-file",
        recommendation:
          "Remove sensitive credentials from source control and use environment variables or a secrets manager.",
      });
    }
  }

  /*
   * Secret-content scanning is performed separately when
   * file contents are available.
   *
   * The current repository scanner only provides the Git tree,
   * so this function does not attempt to download every file here.
   *
   * This keeps the scanner fast and avoids accidentally storing
   * secret values.
   */
  return findings;
}

export function detectSecretsInContent(
  filePath: string,
  content: string
): Finding[] {
  if (!isScannableFile(filePath)) {
    return [];
  }

  const findings: Finding[] = [];
  const lines = content.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    /*
     * Skip obvious comments where possible.
     * This reduces false positives in documentation/examples.
     */
    const trimmed = line.trim();

    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("*")
    ) {
      continue;
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          category: "SECURITY",
          severity: pattern.severity,
          title: `Potential ${pattern.name} exposed`,
          description:
            "A possible credential or secret was detected in repository source code.",
          file: filePath,
          line: index + 1,
          rule: "secret-detection",
          recommendation: pattern.recommendation,
        });

        /*
         * Only report the first matching secret on a line.
         * We never include the matched value in the finding.
         */
        break;
      }
    }
  }

  return findings;
}