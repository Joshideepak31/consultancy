import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Globe2, ListChecks, BadgeDollarSign,
  Workflow, ImageIcon, FileSpreadsheet, NotebookPen, Users, Settings, History,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", to: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Knowledge Base",
    items: [
      { title: "Countries", to: "/admin/countries", icon: Globe2 },
      { title: "Requirements Rules", to: "/admin/requirements", icon: ListChecks },
      { title: "Fees & Scholarships", to: "/admin/fees", icon: BadgeDollarSign },
      { title: "Process Maps", to: "/admin/process-maps", icon: Workflow },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Document Hub", to: "/admin/media", icon: ImageIcon },
      { title: "Excel Upload", to: "/admin/excel", icon: FileSpreadsheet },
      { title: "Knowledge Notes", to: "/admin/notes", icon: NotebookPen },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Counselors", to: "/admin/counselors", icon: Users },
      { title: "Audit Log", to: "/admin/audit", icon: History },
      { title: "Settings", to: "/admin/settings", icon: Settings },
    ],
  },
];

function AdminLayout() {
  const { initialized, user, role } = useAuth();
  if (!initialized) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/" />;
  if (role !== "admin") return <Navigate to="/counselor" />;
  return <AppShell groups={groups} brand="EduCraft Admin" />;
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}