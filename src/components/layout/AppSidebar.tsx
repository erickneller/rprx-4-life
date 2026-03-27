import { LayoutDashboard, MessageSquare, FileText, Target, User, TrendingUp, GraduationCap, Rocket, DollarSign, ShieldCheck, HeartPulse, Landmark, RefreshCw, Wallet, Receipt, BadgeDollarSign, ClipboardList, Shield, Building2, Phone, LucideIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { GamificationScoreCard } from "@/components/gamification/GamificationScoreCard";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { useAdmin } from "@/hooks/useAdmin";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useCompany } from "@/hooks/useCompany";
import { useAdvisorLink } from "@/hooks/useAdvisorLink";
import { useSidebarConfig } from "@/hooks/useSidebarConfig";

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

type NavItem = { title: string; url: string; icon: LucideIcon; comingSoon?: boolean; configId?: string };

const sections: { label: string | null; configId?: string; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, configId: "item:dashboard" }],
  },
  {
    label: "Financial Stability",
    configId: "section:financial_stability",
    items: [
      { title: "Debt Elimination System", url: "/debt-eliminator", icon: Target, configId: "item:debt_eliminator" },
      { title: "Cash Flow Control System", url: "#", icon: Wallet, comingSoon: true, configId: "item:cash_flow_control" },
      { title: "Tax Efficiency System", url: "#", icon: Receipt, comingSoon: true, configId: "item:tax_efficiency" },
      { title: "Income Optimization Strategy", url: "#", icon: BadgeDollarSign, comingSoon: true, configId: "item:income_optimization" },
    ],
  },
  {
    label: "Financial Growth",
    configId: "section:financial_growth",
    items: [
      { title: "Financial Freedom Strategy", url: "#", icon: TrendingUp, comingSoon: true, configId: "item:financial_freedom" },
      { title: "Education Advantage Framework", url: "#", icon: GraduationCap, comingSoon: true, configId: "item:education_advantage" },
      { title: "Strategic Wealth Moves", url: "#", icon: Rocket, comingSoon: true, configId: "item:strategic_wealth" },
      { title: "Income Expansion Strategy", url: "#", icon: DollarSign, comingSoon: true, configId: "item:income_expansion" },
    ],
  },
  {
    label: "Financial Protection",
    configId: "section:financial_protection",
    items: [
      { title: "Protection Alignment Strategy", url: "#", icon: ShieldCheck, comingSoon: true, configId: "item:protection_alignment" },
      { title: "Health Cost Strategy", url: "#", icon: HeartPulse, comingSoon: true, configId: "item:health_cost" },
      { title: "Legacy Continuity System", url: "#", icon: Landmark, comingSoon: true, configId: "item:legacy_continuity" },
      { title: "Life Transition Strategy", url: "#", icon: RefreshCw, comingSoon: true, configId: "item:life_transition" },
    ],
  },
];

const chatItem: NavItem = { title: "Strategy Assistant", url: "/strategy-assistant", icon: MessageSquare, configId: "item:strategy_assistant" };
const navItems: NavItem[] = [
  { title: "My Assessments", url: "/assessments", icon: ClipboardList, configId: "item:my_assessments" },
  { title: "My Plans", url: "/plans", icon: FileText, configId: "item:my_plans" },
  { title: "My Profile", url: "/profile", icon: User, configId: "item:my_profile" },
];



export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin } = useAdmin();
  const { enabled: chatEnabled } = useFeatureFlag('chat_enabled');
  const { membership } = useCompany();
  const isCompanyAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  const { enabled: advisorEnabled, url: advisorUrl } = useAdvisorLink();
  const { isVisible } = useSidebarConfig();

  const resolveAdvisorHref = (url: string) => {
    const digits = url.replace(/\D/g, '');
    if (digits.length >= 10 && !/^https?:\/\//i.test(url)) return `tel:+1${digits.slice(-10)}`;
    return url;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {/* Compact gamification stats */}
        {!isCollapsed && (
          <div className="px-3 pb-2 space-y-2">
            <GamificationScoreCard compact />
            <StreakCounter compact />
          </div>
        )}
        {sections.map((section, idx) => {
          const sectionHidden = section.configId && !isVisible(section.configId);
          if (sectionHidden) return null;
          const visibleItems = section.items.filter(item => !item.configId || isVisible(item.configId));
          if (visibleItems.length === 0 && section.label) return null;
          return (
            <SidebarGroup key={idx}>
              {section.label && (
                <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-sm font-bold text-foreground"}>
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.comingSoon ? (
                        <SidebarMenuButton tooltip={item.title} className="flex items-center gap-3 rounded-md px-3 py-2 text-foreground cursor-default hover:bg-foreground hover:text-background transition-colors">
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
          );
        })}

        {/* Remaining nav items (to be organized in next step) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatEnabled && isVisible('item:strategy_assistant') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={chatItem.title}>
                    <NavLink
                      to={chatItem.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <chatItem.icon className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>{chatItem.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {navItems.filter(item => !item.configId || isVisible(item.configId)).map((item) => (
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

        {/* Advisor CTA */}
        {advisorEnabled && advisorUrl && isVisible('item:advisor_link') && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Speak with an Advisor" asChild>
                    <a
                      href={resolveAdvisorHref(advisorUrl)}
                      target={resolveAdvisorHref(advisorUrl).startsWith('tel:') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-primary font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Phone className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>Speak with an Advisor</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Company dashboard - visible to company owners/admins */}
        {isCompanyAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Company Dashboard">
                    <NavLink
                      to="/company-dashboard"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <Building2 className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>Company</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin link - only visible to admins */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Admin Panel">
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <Shield className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>Admin Panel</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
