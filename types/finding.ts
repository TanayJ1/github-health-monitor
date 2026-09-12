export type FindingSeverity =
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW"
  | "INFO";

export type FindingCategory =
  | "SECURITY"
  | "DEPENDENCY"
  | "TESTING"
  | "DOCUMENTATION"
  | "CICD"
  | "CODE_QUALITY"
  | "GIT_ACTIVITY"
  | "PULL_REQUEST"
  | "ISSUE";

export interface Finding {
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  file?: string;
  line?: number;
  rule?: string;
  recommendation?: string;
}