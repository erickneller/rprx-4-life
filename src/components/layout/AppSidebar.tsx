import { LayoutDashboard, MessageSquare, FileText, Target, User, TrendingUp, GraduationCap, Rocket, DollarSign, ShieldCheck, HeartPulse, Landmark, RefreshCw, Wallet, Receipt, BadgeDollarSign, LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: LucideIcon; comingSoon?: boolean };

const sections: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Financial Stability",
    items: [
      { title: "Debt Elimination System", url: "/debt-eliminator", icon: Target },
      { title: "Cash Flow Control System", url: "#", icon: Wallet, comingSoon: true },
      { title: "Tax Efficiency System", url: "#", icon: Receipt, comingSoon: true },
      { title: "Income Optimization Strategy", url: "#", icon: BadgeDollarSign, comingSoon: true },
    ],
  },
  {
    label: "Financial Growth",
    items: [
      { title: "Financial Freedom Strategy", url: "#", icon: TrendingUp, comingSoon: true },
      { title: "Education Advantage Framework", url: "#", icon: GraduationCap, comingSoon: true },
      { title: "Strategic Wealth Moves", url: "#", icon: Rocket, comingSoon: true },
      { title: "Income Expansion Strategy", url: "#", icon: DollarSign, comingSoon: true },
    ],
  },
  {
    label: "Financial Protection",
    items: [
      { title: "Protection Alignment Strategy", url: "#", icon: ShieldCheck, comingSoon: true },
      { title: "Health Cost Strategy", url: "#", icon: HeartPulse, comingSoon: true },
      { title: "Legacy Continuity System", url: "#", icon: Landmark, comingSoon: true },
      { title: "Life Transition Strategy", url: "#", icon: RefreshCw, comingSoon: true },
    ],
  },
];

const navItems = [
  { title: "Strategy Assistant", url: "/strategy-assistant", icon: MessageSquare },
  { title: "Strategy Assistant", url: "/strategy-assistant", icon: MessageSquare },
  { title: "My Plans", url: "/plans", icon: FileText },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {sections.map((section, idx) => (
          <SidebarGroup key={idx}>
            {section.label && (
              <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-sm font-bold text-foreground"}>
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.comingSoon ? (
                      <SidebarMenuButton tooltip={item.title} className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground cursor-default hover:bg-transparent">
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={isCollapsed ? "sr-only" : "text-sm"}>
                          {item.title} <span className="text-xs opacity-60">(Coming Soon)</span>
                        </span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span className={isCollapsed ? "sr-only" : ""}>
                            {item.title}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Remaining nav items (to be organized in next step) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
