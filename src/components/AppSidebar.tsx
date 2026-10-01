import { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  PieChart,
  FileText,
  Package,
  Store,
  BarChart,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import capsuleLogo from "@/assets/capsule-logo.png";

const items = [
  { title: "لوحة التحكم", url: "/", icon: PieChart },
  { title: "طلبات تحديث المخزون", url: "/requests", icon: FileText },
  { title: "قائمة المنتجات المسموح بها", url: "/products", icon: Package },
  { title: "الصيدليات", url: "/pharmacies", icon: Store },
  { title: "التقارير", url: "/reports", icon: BarChart },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 bg-sidebar border-l border-sidebar-border flex flex-col h-screen sticky top-0 transition-[width] duration-300",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "فتح الشريط الجانبي" : "إغلاق الشريط الجانبي"}
            className="h-8 w-8 rounded-full border border-sidebar-border flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-sm font-semibold text-muted-foreground">كبسولة</div>
                <div className="text-base font-bold text-sidebar-foreground mt-0.5">مشرف رئيسي</div>
              </div>
              <img src={capsuleLogo} alt="كبسولة" className="h-5 w-auto -rotate-45" />
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-5 flex items-center gap-2 rounded-full border border-sidebar-border px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              أ
            </div>
            <span className="text-sm text-sidebar-foreground flex-1 text-right">أحمد محمد - العمليات</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl text-sm font-medium transition-colors flex-row-reverse text-right",
                collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => navigate({ to: "/login" })}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent w-full flex-row-reverse text-right",
            collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="flex-1">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
