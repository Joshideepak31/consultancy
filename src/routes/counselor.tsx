import { createFileRoute, Navigate } from "@tanstack/react-router";
import {
  LayoutDashboard, BookOpen, Globe2,
  UserSearch, Users, Workflow, ImageIcon, NotebookPen, Activity,
} from "lucide-react";
import { AppShell, type NavGroup } from "@/components/app-shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/counselor")({
  component: CounselorLayout,
});

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", to: "/counselor", icon: LayoutDashboard }],
  },
  {
    label: "Knowledge Base",
    items: [
      { title: "Knowledge Base", to: "/counselor/knowledge", icon: BookOpen },
      { title: "Countries", to: "/counselor/countries", icon: Globe2 },
    ],
  },
  {
    label: "Counseling",
    items: [
      { title: "Student Matcher", to: "/counselor/matcher", icon: UserSearch },
      { title: "Saved Students", to: "/counselor/students", icon: Users },
      { title: "Student Tracker", to: "/counselor/tracker", icon: Activity },
      { title: "Process Guides", to: "/counselor/process", icon: Workflow },
      { title: "Media References", to: "/counselor/media", icon: ImageIcon },
      { title: "Counseling Notes", to: "/counselor/notes", icon: NotebookPen },
    ],
  },
];

function CounselorLayout() {
  const { initialized, user, role } = useAuth();
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/" />;
  // counselors and admins both can use counselor area
  if (role !== "counselor" && role !== "admin") return <Navigate to="/" />;
  return <AppShell groups={groups} brand="EduCraft Counselor" />;
}