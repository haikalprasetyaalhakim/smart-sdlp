// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const isAdmin = session.user.role?.toLowerCase() === "admin";
  redirect(isAdmin ? "/admin/dashboard" : "/dashboard");
}
