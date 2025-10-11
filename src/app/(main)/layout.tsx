import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/actions/userActions";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentUser();

  if (!result.success) {
    redirect("/sign-in");
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar user={result.data} />

      <SidebarInset className="flex flex-col">
        {/* Header is now in layout */}
        <PageHeader />

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
