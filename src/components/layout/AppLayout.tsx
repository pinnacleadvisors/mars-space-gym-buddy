import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 pb-20 md:pb-4">{children}</main>
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
