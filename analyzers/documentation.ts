import { Finding } from "@/types/finding";
import { RepositoryFile } from "@/analyzers/repositoryStructure";

export function analyzeDocumentation(
  files: RepositoryFile[]
): Finding[] {
  const findings: Finding[] = [];

  const filePaths = files.map((file) => file.path.toLowerCase());

  const hasReadme = filePaths.includes("readme.md");

  const hasDocs = files.some(
    (file) =>
      file.path.toLowerCase().startsWith("docs/") ||
      file.path.toLowerCase().startsWith("documentation/")
  );

  const hasLicense = filePaths.some(
    (path) =>
      path === "license" ||
      path === "license.md" ||
      path === "license.txt"
  );

//   if (!hasReadme) {
//     findings.push({
//       category: "DOCUMENTATION",
//       severity: "HIGH",
//       title: "Project documentation is missing",
//       description:
//         "The repository does not contain a README.md file describing the project.",
//       rule: "DOCUMENTATION_MISSING",
//       recommendation:
//         "Create a README.md containing the project overview, setup instructions, usage, configuration, and technology stack.",
//     });
//   }

  if (!hasDocs) {
    findings.push({
      category: "DOCUMENTATION",
      severity: "LOW",
      title: "Dedicated documentation directory is missing",
      description:
        "No docs/ or documentation/ directory was detected.",
      rule: "DOCS_DIRECTORY_MISSING",
      recommendation:
        "Consider adding a documentation directory for architecture, API references, guides, and technical documentation.",
    });
  }

  if (!hasLicense) {
    findings.push({
      category: "DOCUMENTATION",
      severity: "LOW",
      title: "License file is missing",
      description:
        "No standard LICENSE file was detected.",
      rule: "LICENSE_MISSING",
      recommendation:
        "Add an appropriate open-source license if the project is intended to be distributed publicly.",
    });
  }

  return findings;
}