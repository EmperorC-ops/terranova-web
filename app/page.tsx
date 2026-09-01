import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function RootPage() {
  const role = cookies().get("tn_role")?.value;

  if (!role) redirect("/auth/login");

  const isInternal = role === "admin" || role === "manager" || role === "agent";
  redirect(isInternal ? "/internal/dashboard" : "/external/portal");
}
