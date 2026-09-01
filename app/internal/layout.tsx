import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Page titles per route segment
const PAGE_TITLES: Record<string, string> = {
  dashboard:  "Dashboard",
  properties: "Properties",
  deals:      "Pipeline",
  documents:  "Documents",
  surveys:    "Surveys",
  approvals:  "Approvals",
};

export default function InternalLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
