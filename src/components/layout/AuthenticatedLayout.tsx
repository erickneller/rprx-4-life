import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useIsMobile } from "@/hooks/use-mobile";
import rprxLogo from "@/assets/rprx-logo.png";

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AuthenticatedLayout({ children, title }: AuthenticatedLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                <img src={rprxLogo} alt="RPRx 4 Life" className="h-8 w-auto" />
                {title && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{title}</h1>
                  </>
                )}
              </div>
            </div>
            
            <ProfileAvatar />
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
