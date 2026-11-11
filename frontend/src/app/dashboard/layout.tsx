"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  Building2,
  Activity,
  FileText,
  Image as ImageIcon,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { DashboardLoginView } from "@/components/dashboard/DashboardLoginView";
import { toast } from "sonner";

/** Role-based shell for `/dashboard/*` that renders inline sign-in until authenticated. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = (user?.role || "").toUpperCase();
  const isRecognizedRole =
    userRole === "ADMIN" || userRole === "DOCTOR" || userRole === "DOCTOR_ASSISTANT";

  const navItems = useMemo(() => {
    if (userRole === "DOCTOR") {
      return [
        { label: "Doctor Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "My Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "My Profile & Hours", href: "/dashboard/doctors", icon: Stethoscope },
        { label: "My Assistants", href: "/dashboard/assistants", icon: ShieldCheck },
        { label: "My Patients", href: "/dashboard/patients", icon: Users },
      ];
    }
    if (userRole === "DOCTOR_ASSISTANT") {
      return [
        { label: "Assistant Desk", href: "/dashboard", icon: LayoutDashboard },
        { label: "Appointment Queue", href: "/dashboard/appointments", icon: Calendar },
        { label: "Assigned Doctor", href: "/dashboard/doctors", icon: Stethoscope },
        { label: "My Patients", href: "/dashboard/patients", icon: Users },
      ];
    }
    if (userRole === "ADMIN") {
      return [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
        { label: "Doctors", href: "/dashboard/doctors", icon: Stethoscope },
        { label: "Staff & Roles", href: "/dashboard/staff", icon: ShieldCheck },
        { label: "Patients", href: "/dashboard/patients", icon: Users },
        { label: "Services", href: "/dashboard/services", icon: Activity },
        { label: "Departments", href: "/dashboard/departments", icon: Building2 },
        { label: "Health Blog", href: "/dashboard/blog", icon: FileText },
        { label: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
        { label: "Settings", href: "/dashboard/settings", icon: Settings },
      ];
    }
    return [];
  }, [userRole]);

  const isRouteAllowed = useMemo(() => {
    if (!isAuthenticated || !isRecognizedRole) return false;
    if (userRole === "ADMIN") return true;
    return navItems.some((item) =>
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href)
    );
  }, [isAuthenticated, isRecognizedRole, userRole, navItems, pathname]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isRecognizedRole && !isRouteAllowed) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, isRecognizedRole, isRouteAllowed, router]);

  const roleTitle =
    userRole === "DOCTOR"
      ? "Doctor Dashboard"
      : userRole === "DOCTOR_ASSISTANT"
      ? "Assistant Desk"
      : "Admin Dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Loading DoctorPro Dashboard...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <DashboardLoginView />;
  }

  const handleLogout = () => {
    logout();
    toast.success("Signed Out", {
      description: "You have been signed out of the dashboard.",
    });
    router.push("/dashboard");
  };

  if (!isRecognizedRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center space-y-4">
        <p className="text-sm font-semibold text-foreground">
          This account role does not have access to the dashboard.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Sign Out
          </Button>
          <Button asChild size="sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isRouteAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Redirecting to your role dashboard...
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-base tracking-tight text-foreground">
              Doctor<span className="text-primary">Pro</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {roleTitle}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t space-y-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href="/" target="_blank">
              <ExternalLink className="mr-2 h-3.5 w-3.5" /> View Public Site
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-card flex flex-col z-10 border-r">
            <div className="h-16 flex items-center justify-between px-6 border-b">
              <span className="font-bold text-base">DoctorPro {roleTitle}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      active
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-xs text-rose-500"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-foreground">
                {userRole === "DOCTOR"
                  ? "Doctor Practice Dashboard"
                  : userRole === "DOCTOR_ASSISTANT"
                  ? "Assistant Desk & Queue"
                  : "Clinic Administration"}
              </h2>
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold ${
                  userRole === "DOCTOR"
                    ? "bg-teal-100 text-teal-800"
                    : userRole === "DOCTOR_ASSISTANT"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-sky-100 text-sky-800"
                }`}
              >
                {userRole}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{user?.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border">
              {(user?.name || "U").charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
