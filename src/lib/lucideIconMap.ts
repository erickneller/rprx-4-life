import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FALLBACK: LucideIcon = (Icons as any).Circle;

export function getIcon(name?: string | null): LucideIcon {
  if (!name) return FALLBACK;
  const Comp = (Icons as any)[name];
  return (Comp as LucideIcon) || FALLBACK;
}

// Curated list shown first in the picker; full search falls back to all icons
export const POPULAR_ICONS: string[] = [
  "LayoutDashboard","Target","Wallet","Receipt","BadgeDollarSign","TrendingUp",
  "GraduationCap","Rocket","DollarSign","ShieldCheck","HeartPulse","Landmark",
  "RefreshCw","MessageSquare","FileText","ClipboardList","Handshake","BookOpen",
  "User","Phone","Building2","Shield","Star","Heart","Home","Settings","Bell",
  "Calendar","Bookmark","Award","Briefcase","PiggyBank","Coins","CreditCard",
  "ChartLine","ChartBar","ChartPie","Zap","Lightbulb","Compass","Map","Flag",
  "Trophy","Gift","Sparkles","Users","UserCheck","Mail","Link","Globe",
];

export function getAllIconNames(): string[] {
  return Object.keys(Icons).filter((k) => {
    const v = (Icons as any)[k];
    return typeof v === "object" || typeof v === "function";
  }).filter((k) => /^[A-Z]/.test(k) && !k.endsWith("Icon") && k !== "createLucideIcon" && k !== "default");
}
