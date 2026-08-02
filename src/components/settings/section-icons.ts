// Tab-strip icons, kept out of model.ts so that file stays importable from the
// server without pulling a client-side icon library into the payload.

import {
  Bell,
  KeyRound,
  Layers,
  Lock,
  MessageSquare,
  Settings,
  ShieldAlert,
  Unplug,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { SectionId } from "@/lib/settings/model";

export const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  general: Settings,
  accounts: Layers,
  team: Users,
  notifications: Bell,
  automation: Zap,
  dm: MessageSquare,
  privacy: Lock,
  integrations: Unplug,
  api: KeyRound,
  danger: ShieldAlert,
};
