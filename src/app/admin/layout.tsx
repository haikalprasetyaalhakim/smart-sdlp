import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role?.toLowerCase() !== "admin") redirect("/dashboard");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 max-w-350 w-full mx-auto mt-10 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
