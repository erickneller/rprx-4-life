import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useIsMobile } from "@/hooks/use-mobile";
import rprxLogo from "@/assets/rprx-logo.png";
import { PageHelpButton } from "@/components/help/PageHelpButton";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  href?: string;
}

interface AuthenticatedLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbEntry[];
}

export function AuthenticatedLayout({ children, title, breadcrumbs }: AuthenticatedLayoutProps) {
  const isMobile = useIsMobile();

  // Build the breadcrumb trail
  const crumbs: BreadcrumbEntry[] = (() => {
    if (breadcrumbs) {
      // Custom breadcrumbs: prepend Dashboard as root
      return [{ label: "Dashboard", href: "/dashboard" }, ...breadcrumbs];
    }
    if (title && title !== "Dashboard") {
      return [{ label: "Dashboard", href: "/dashboard" }, { label: title }];
    }
    // Dashboard page itself — just show "Dashboard" as current
    return [{ label: "Dashboard" }];
  })();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1" />
              <img src={rprxLogo} alt="RPRx 4 Life" className="h-8 w-auto" />
              <Breadcrumb>
                <BreadcrumbList>
                  {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1;
                    return (
                      <BreadcrumbItem key={index}>
                        {index > 0 && <BreadcrumbSeparator />}
                        {isLast ? (
                          <BreadcrumbPage className="text-lg font-semibold">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.href!}>{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            <ProfileAvatar />
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>

          <PageHelpButton />
        </div>
      </div>
    </SidebarProvider>
  );
}
