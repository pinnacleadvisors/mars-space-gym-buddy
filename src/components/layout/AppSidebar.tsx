"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  BookOpen,
  LayoutDashboard,
  Users,
  BarChart3,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CreditCard,
  UserCog,
  Trophy,
  Settings,
  Ticket,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open, toggleSidebar, setOpenMobile } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔐 Check user role from user_roles table
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }

        setIsAdmin(data?.role === "admin");
      } catch (err) {
        console.error("Role check failed:", err);
      }
    };

    checkUserRole();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  // Quick Actions
  const quickActions = [
    { icon: QrCode, label: "Entry/Exit", path: "/qr/entry-exit" }
  ];

  // 🧭 Always visible (member) menu
  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Calendar, label: "Classes", path: "/classes" },
    { icon: BookOpen, label: "Bookings", path: "/bookings" },
    { icon: CreditCard, label: "Membership", path: "/managememberships" },
    { icon: Trophy, label: "Rewards", path: "/rewards" },
  ];

  // 🧩 Admin-only menu (added if admin)
  const adminNavItems = [
    { icon: LayoutDashboard, label: "Admin Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Dumbbell, label: "Manage Classes", path: "/admin/manageclasses" },
    { icon: CreditCard, label: "Memberships", path: "/admin/memberships" },
    { icon: UserCog, label: "User Memberships", path: "/admin/usermemberships" },
    { icon: Ticket, label: "Deals & Referrals", path: "/admin/managedeals" },
  ];
  
  
  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {/* Desktop toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto hidden md:flex"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* MAIN MENU */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => {
                        navigate(item.path);
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          setOpenMobile(false);
                        }
                      }}
                      className={cn(
                        "transition-colors",
                        active && "bg-primary/10 text-primary font-medium"
                      )}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ADMIN MENU (only if admin) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        onClick={() => {
                          navigate(item.path);
                          // Close sidebar on mobile after navigation
                          if (window.innerWidth < 768) {
                            setOpenMobile(false);
                          }
                        }}
                        className={cn(
                          "transition-colors",
                          active && "bg-primary/10 text-primary font-medium"
                        )}
                        tooltip={item.label}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* QUICK ACTIONS */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {quickActions.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => {
                        navigate(item.path);
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 768) {
                          setOpenMobile(false);
                        }
                      }}
                      className={cn(
                        "transition-colors",
                        active && "bg-primary/10 text-primary font-medium"
                      )}
                      tooltip={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
