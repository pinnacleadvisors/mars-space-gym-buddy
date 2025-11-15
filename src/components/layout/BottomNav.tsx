"use client";

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Calendar,
  BookOpen,
  LayoutDashboard,
  CreditCard,
  Users,
  BarChart3,
  ClipboardList,
  UserCheck,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  // 🔐 Check if the logged-in user is an admin
  useEffect(() => {
    const checkAdminRole = async () => {
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

    checkAdminRole();
  }, []);

  // 🧭 Default member navigation items
  const baseNavItems = [
    { icon: Calendar, label: "Classes", path: "/classes" },
    { icon: BookOpen, label: "Bookings", path: "/bookings" },
    { icon: CreditCard, label: "Membership", path: "/managememberships" },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  ];

  // 🧩 Admin-only navigation items (appended if admin)
  const adminNavItems = [
    { icon: Shield, label: "Admin", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: ClipboardList, label: "Classes", path: "/admin/manageclasses" },
    { icon: CreditCard, label: "Memberships", path: "/admin/memberships" },
    { icon: UserCheck, label: "User Memberships", path: "/admin/usermemberships" },
  ];

  // 🧠 Combine base + admin navs if user is admin
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div
        className={cn(
          "grid h-16",
          `grid-cols-${navItems.length}` // Adjust dynamically based on number of items
        )}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors px-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
