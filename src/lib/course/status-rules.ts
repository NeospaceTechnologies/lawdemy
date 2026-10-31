import type { CourseStatus } from "@prisma/client";

// Actions allowed by course status (PRD 7.2). The server checks these; the UI only mirrors them.
export type CourseAction = "edit" | "submit" | "duplicate" | "archive" | "restore" | "delete";

export function allowedActions(status: CourseStatus, enrolled: number): CourseAction[] {
  switch (status) {
    case "DRAFT":
      return ["edit", "submit", "duplicate", "delete"];
    case "UNDER_REVIEW":
      return [];
    case "REJECTED":
      return ["edit", "submit", "duplicate", "delete"];
    case "LIVE":
      return ["duplicate", "archive"];
    case "ARCHIVED":
      return enrolled > 0 ? ["duplicate", "restore"] : ["duplicate", "restore", "delete"];
  }
}
