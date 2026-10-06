import {
  Activity,
  Building2,
  BadgeIndianRupee,
  Bell,
  CalendarCheck,
  CalendarPlus,
  ClipboardList,
  FileHeart,
  LayoutDashboard,
  PhoneCall,
  Stethoscope,
  Users,
  CalendarOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shown in the mobile bottom bar (max 5 per role). */
  primary?: boolean;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  Patient: [
    { label: "Overview", to: "/patient", icon: LayoutDashboard, primary: true },
    { label: "AI Triage", to: "/patient/triage", icon: Activity, primary: true },
    { label: "Book Visit", to: "/patient/book", icon: CalendarPlus, primary: true },
    { label: "Appointments", to: "/patient/appointments", icon: CalendarCheck, primary: true },
    { label: "Medical History", to: "/patient/history", icon: FileHeart },
    { label: "My Profile", to: "/patient/profile", icon: ClipboardList },
    { label: "Notifications", to: "/patient/notifications", icon: Bell, primary: true },
  ],
  Doctor: [
    { label: "Today's Queue", to: "/doctor", icon: LayoutDashboard, primary: true },
    { label: "Consultations", to: "/doctor/consultations", icon: Stethoscope, primary: true },
    { label: "Mark Leave", to: "/doctor/leave", icon: CalendarOff, primary: true },
    { label: "My Profile", to: "/doctor/profile", icon: ClipboardList },
  ],
  Admin: [
    { label: "Overview", to: "/admin", icon: LayoutDashboard, primary: true },
    { label: "Users", to: "/admin/users", icon: Users, primary: true },
    { label: "Departments", to: "/admin/departments", icon: Building2 },
    { label: "Appointments", to: "/admin/appointments", icon: ClipboardList, primary: true },
    { label: "Follow-up List", to: "/admin/follow-up", icon: PhoneCall, primary: true },
    { label: "Doctor Leave", to: "/admin/leave", icon: CalendarOff },
    { label: "Billing", to: "/admin/billing", icon: BadgeIndianRupee, primary: true },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  Patient: "Patient",
  Doctor: "Doctor",
  Admin: "Admin / Reception",
};
