import { Phone, Building2, Shield, Lock, Library as LibraryIcon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSidebar } from "@/components/ui/sidebar";
import { GamificationScoreCard } from "@/components/gamification/GamificationScoreCard";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { useAdmin } from "@/hooks/useAdmin";
import { useLibraryAdmin } from "@/hooks/useLibraryAdmin";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useCompany } from "@/hooks/useCompany";
import { useAdvisorLink } from "@/hooks/useAdvisorLink";
import { useSidebarConfig, type NavConfigRow } from "@/hooks/useSidebarConfig";
import { getIcon } from "@/lib/lucideIconMap";
import { useUpgradeGate } from "@/contexts/UpgradeGateContext";
import { NAV_ITEM_FEATURE, normalizeRequiredTier, tierMeets } from "@/lib/upgradeFeatures";
import { useSubscription } from "@/hooks/useSubscription";

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

// Items gated by feature flag / role — hidden if these conditions aren't met,
// regardless of visibility row state.
const FEATURE_GATED: Record<string, (ctx: { chatEnabled: boolean }) => boolean> = {
  'item:strategy_assistant': ({ chatEnabled }) => chatEnabled,
};

function NavItemRow({ item, isCollapsed }: { item: NavConfigRow; isCollapsed: boolean }) {
  const Icon = getIcon(item.icon);
  const linkType = item.link_type;
  const url = linkType === 'course' ? `/course/${item.id}` : (item.url || '#');
  const { isLocked, requireUpgrade } = useUpgradeGate();
  const { tier } = useSubscription();

  // DB-driven gating is authoritative. If the row's required_tier column exists
  // (including 'free'), it wins over the legacy hardcoded NAV_ITEM_FEATURE map.
  const featureKey = NAV_ITEM_FEATURE[item.id];
  const dbTier = item.required_tier != null
    ? normalizeRequiredTier(item.required_tier)
    : (featureKey ? undefined : 'free');
  const locked = dbTier !== undefined
    ? !tierMeets(tier, dbTier)
    : (featureKey ? isLocked(featureKey) : false);

  if (linkType === 'coming_soon') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={item.label} className="flex items-center gap-3 rounded-md px-3 py-2 text-foreground cursor-default hover:bg-foreground hover:text-background transition-colors">
          <Icon className="h-5 w-5 shrink-0" />
          <span className={isCollapsed ? "sr-only" : "text-sm"}>
            {item.label} <span className="text-xs opacity-60">(Coming Soon)</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (linkType === 'external') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip={item.label}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={isCollapsed ? "sr-only" : "flex-1 text-sm"}>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (locked) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={`${item.label} — Upgrade required`}
          onClick={() => requireUpgrade({ feature: featureKey ?? item.id, requiredTier: dbTier })}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className={isCollapsed ? "sr-only" : "flex-1 text-sm flex items-center gap-2"}>
            <span className="truncate">{item.label}</span>
            <Lock className="h-3 w-3 opacity-70 ml-auto shrink-0" />
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={item.label}>
        <NavLink
          to={url}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span className={isCollapsed ? "sr-only" : "flex-1 text-sm"}>
            {item.label}
            {linkType === 'course' && (
              <span className="ml-2 text-[10px] uppercase tracking-wide opacity-70">Course</span>
            )}
          </span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin } = useAdmin();
  const { isLibraryAdmin } = useLibraryAdmin();
  const { enabled: chatEnabled } = useFeatureFlag('chat_enabled');
  const { enabled: streakSidebarVisible } = useFeatureFlag('streak_visible');

  const { membership } = useCompany();
  const isCompanyAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  const { enabled: advisorEnabled, url: advisorUrl } = useAdvisorLink();
  const { rows, isVisible, sections, itemsBySection, orphanItems } = useSidebarConfig();
  const { tier } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();

  const advisorRow = rows.find(r => r.id === 'item:advisor_link' || r.url === '/virtual-advisor');
  const advisorRequired = normalizeRequiredTier(advisorRow?.required_tier);
  const advisorLocked = !tierMeets(tier, advisorRequired);

  const resolveAdvisorHref = (url: string) => {
    const digits = url.replace(/\D/g, '');
    if (digits.length >= 10 && !/^https?:\/\//i.test(url)) return `tel:+1${digits.slice(-10)}`;
    return url;
  };

  const showItem = (item: NavConfigRow) => {
    if (!isVisible(item.id)) return false;
    const gate = FEATURE_GATED[item.id];
    if (gate && !gate({ chatEnabled })) return false;
    return true;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {!isCollapsed && (
          <div className="px-3 pb-2 space-y-2">
            <GamificationScoreCard compact />
            {streakSidebarVisible && <StreakCounter compact />}
          </div>
        )}


        {/* Orphan items (no section) — e.g. Dashboard */}
        {orphanItems.filter(showItem).length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {orphanItems.filter(showItem).map(item => (
                  <NavItemRow key={item.id} item={item} isCollapsed={isCollapsed} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {sections.map((section) => {
          if (!isVisible(section.id)) return null;
          const items = (itemsBySection.get(section.id) || []).filter(showItem);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section.id}>
              <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-sm font-bold text-foreground"}>
                {section.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map(item => <NavItemRow key={item.id} item={item} isCollapsed={isCollapsed} />)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* Advisor CTA */}
        {advisorEnabled && isVisible('item:advisor_link') && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {advisorLocked ? (
                    <SidebarMenuButton
                      tooltip="Speak With A Virtual Advisor — Upgrade required"
                      onClick={() => requireUpgrade({ feature: 'virtual-advisor', requiredTier: advisorRequired })}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-primary font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Phone className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : "flex-1 flex items-center gap-2"}>
                        <span className="truncate">Speak With A Virtual Advisor</span>
                        <Lock className="h-3 w-3 opacity-70 ml-auto shrink-0" />
                      </span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton tooltip="Speak With A Virtual Advisor" asChild>
                      <NavLink
                        to="/virtual-advisor"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-primary font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        <Phone className="h-5 w-5 shrink-0" />
                        <span className={isCollapsed ? "sr-only" : ""}>Speak With A Virtual Advisor</span>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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

        {isLibraryAdmin && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Library Admin">
                    <NavLink
                      to="/library-admin"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <LibraryIcon className="h-5 w-5 shrink-0" />
                      <span className={isCollapsed ? "sr-only" : ""}>Library Admin</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
