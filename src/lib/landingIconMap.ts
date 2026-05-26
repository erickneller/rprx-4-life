// Curated icon map for landing card content. The admin stores an icon name
// as a string; this map converts it to a Lucide component. Falls back to
// CircleHelp if the name is unknown so the page never crashes.
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BarChart3,
  CircleHelp,
  ClipboardCheck,
  Eye,
  FileQuestion,
  HelpCircle,
  Lightbulb,
  Lock,
  MessageSquareText,
  Server,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BarChart3,
  ClipboardCheck,
  Eye,
  FileQuestion,
  HelpCircle,
  Lightbulb,
  Lock,
  MessageSquareText,
  Server,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Users,
  Wallet,
};

export function getLandingIcon(name?: string): LucideIcon {
  if (!name) return CircleHelp;
  return ICONS[name] || CircleHelp;
}

export const LANDING_ICON_NAMES = Object.keys(ICONS).sort();
