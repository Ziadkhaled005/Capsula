import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  PieChart,
  FileText,
  Package,
  BarChart,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { UploadProvider, useUpload } from "@/contexts/upload-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import capsuleLogo from "@/assets/capsule-logo.png";
import { orders } from "./pharmacy.orders";

const toAr = (n: number) => n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

export const Route = createFileRoute("/pharmacy")({
  component: () => (
    <UploadProvider>
      <PharmacyLayout />
    </UploadProvider>
  ),
});

const navItems = [
  { title: "لوحة التحكم", url: "/pharmacy", icon: PieChart },
  { title: "الطلبات", url: "/pharmacy/orders", icon: FileText },
  { title: "المخزون", url: "/pharmacy/inventory", icon: Package },
  { title: "التقارير", url: "/pharmacy/reports", icon: BarChart },
  { title: "الإعدادات", url: "/pharmacy/settings", icon: Settings },
];

function PharmacyLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [available, setAvailable] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { uploadNotification, setUploadNotification, showSuccessAlert, setShowSuccessAlert } = useUpload();

  useEffect(() => {
    if (!showSuccessAlert) return;
    const t = setTimeout(() => setShowSuccessAlert(false), 5000);
    return () => clearTimeout(t);
  }, [showSuccessAlert, setShowSuccessAlert]);

  const pendingConfirmCount = orders.filter((o) => o.status === "pending-confirm").length;

  return (
    <TooltipProvider delayDuration={150}>
    <div className="min-h-screen flex w-full bg-background" dir="rtl">
      {/* Success alert overlay */}
      {showSuccessAlert && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            width: 320,
            minHeight: 76,
            zIndex: 9999,
            background: "#EDF7ED",
            borderRadius: 4,
            boxShadow: "0px 7px 8px -4px #00000033, 0px 12px 17px 2px #00000024, 0px 5px 22px 4px #0000001F",
            display: "flex",
            alignItems: "flex-start",
            padding: "6px 16px",
            gap: 12,
          }}
        >
          {/* Checkmark icon */}
          <div className="shrink-0 mt-1.5">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path
                d="M11 1.833C5.94 1.833 1.833 5.94 1.833 11S5.94 20.167 11 20.167 20.167 16.06 20.167 11 16.06 1.833 11 1.833zm-1.833 13.75L4.583 11l1.292-1.292 3.292 3.283 6.958-6.958L17.417 7.333l-8.25 8.25z"
                fill="#1E8011"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 text-right py-1">
            <p className="text-sm font-semibold text-[#1E4620] leading-snug">تم تحديث المخزون بنجاح</p>
            <p className="text-xs text-[#1E4620]/80 mt-0.5 leading-relaxed">سيتم تحديث بيانات المخزون تلقائياً</p>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowSuccessAlert(false)}
            className="shrink-0 mt-1.5 text-[#1E4620]/60 hover:text-[#1E4620] transition-colors"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <aside
        className={cn(
          "shrink-0 bg-sidebar border-l border-sidebar-border flex flex-col h-screen sticky top-0 transition-[width] duration-300",
          collapsed ? "w-20" : "w-72",
        )}
      >
        {/* Header */}
        <div className={cn("border-b border-sidebar-border", collapsed ? "px-4 py-5" : "p-6")}>
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "فتح" : "طي"}
              className="h-8 w-8 rounded-full border border-sidebar-border flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"
            >
              {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {!collapsed && (
              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-sm font-semibold text-muted-foreground">كبسولة</div>
                  <div className="text-base font-bold text-sidebar-foreground mt-0.5">صيدلية فينوس</div>
                </div>
                <img src={capsuleLogo} alt="كبسولة" className="h-5 w-auto -rotate-45" />
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "mt-5 flex items-center rounded-full border border-sidebar-border hover:bg-muted/40 outline-none",
                collapsed
                  ? "w-12 h-12 mx-auto justify-center"
                  : "w-full justify-between gap-2 px-4 py-2",
              )}
              aria-label={available ? "متاح لاستقبال طلبات" : "غير متاح لاستقبال طلبات"}
            >
              {collapsed ? (
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    available ? "bg-success" : "bg-muted-foreground",
                  )}
                />
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm text-sidebar-foreground">
                      {available ? "متاح لاستقبال طلبات" : "غير متاح لاستقبال طلبات"}
                    </span>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        available ? "bg-success" : "bg-[color:var(--chart-5)]",
                      )}
                    />
                  </div>
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[15rem]">
              <DropdownMenuItem onClick={() => setAvailable(true)} className="justify-end text-right">
                متاح لاستقبال طلبات
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmOpen(true)} className="justify-end text-right">
                غير متاح لاستقبال طلبات
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.url;
            const link = (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 text-sm font-medium transition-colors flex-row-reverse text-right",
                  collapsed ? "justify-center px-2 py-3 rounded-xl" : "px-4 py-3 rounded-full",
                  active
                    ? "bg-[#CFE9D9] text-[#354B40]"
                    : "text-sidebar-foreground hover:bg-sidebar-accent rounded-xl",
                )}
              >
                {!collapsed && item.url === "/pharmacy/orders" && pendingConfirmCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] text-center shrink-0 bg-[color:var(--warning)] text-[color:var(--color-black)]">
                    {toAr(pendingConfirmCount)}
                  </span>
                )}
                {!collapsed && <span className="flex-1">{item.title}</span>}
                <item.icon className="h-5 w-5 shrink-0" />
              </Link>
            );
            if (!collapsed) return link;
            return (
              <Tooltip key={item.url}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="left">{item.title}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Upload notification card */}
        {uploadNotification && !collapsed && (
          <div className="mx-4 mb-3 rounded border border-[#0288D1] bg-white overflow-hidden">
            <div className="flex items-start gap-3 p-4">
              <button
                onClick={() => setUploadNotification(null)}
                className="shrink-0 text-foreground/40 hover:text-foreground/70 transition-colors mt-0.5"
                aria-label="إغلاق"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold text-foreground">يتم رفع ملف المخزون</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">سيتم تحديث بيانات المخزون تلقائياً</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[170px] mr-auto">{uploadNotification.filename}</p>
              </div>
              <div className="shrink-0 mt-0.5">
                <svg className="animate-spin h-5 w-5 text-[#01579B]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate({ to: "/login" })}
                  aria-label="تسجيل الخروج"
                  className="flex items-center justify-center rounded-xl text-muted-foreground hover:bg-sidebar-accent w-full px-2 py-3"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">تسجيل الخروج</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => navigate({ to: "/login" })}
              className="flex items-center gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent w-full flex-row-reverse text-right px-4 py-3"
            >
              <LogOut className="h-5 w-5" />
              <span className="flex-1">تسجيل الخروج</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-[520px] p-0 gap-0 rounded-2xl overflow-hidden [&>button.absolute]:hidden"
        >
          <DialogHeader className="px-7 pt-7 pb-6 border-b border-border space-y-3">
            <div className="flex items-center gap-3">
              <DialogClose
                aria-label="إغلاق"
                className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0 order-2"
              >
                <X className="h-4 w-4" />
              </DialogClose>
              <DialogTitle className="text-lg font-bold text-right flex-1 order-1">
                هل تريد إيقاف استقبال الطلبات؟
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground text-center pt-1">
              لن يتمكّن العملاء من إرسال طلبات جديدة إلى صيدليتك حتى تعيد تفعيله.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-7 py-4 flex-row justify-start gap-4 sm:justify-start">
            <Button
              variant="destructive"
              className="rounded-lg px-5"
              onClick={() => {
                setAvailable(false);
                setConfirmOpen(false);
                toast.custom(
                  (t) => (
                    <div
                      dir="rtl"
                      className="w-[420px] rounded-xl border border-success/30 bg-success/10 px-5 py-4 shadow-lg flex items-start gap-3"
                    >
                      <button
                        onClick={() => toast.dismiss(t)}
                        aria-label="إغلاق"
                        className="text-success/70 hover:text-success shrink-0 mt-0.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-2 text-success font-bold text-sm">
                          <span>تم إيقاف استقبال الطلبات</span>
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="mt-1 text-xs text-success/80 leading-relaxed">
                          لن يتمكّن العملاء من الشراء حتى تصبح متاح لإستقبال الطلبات.
                        </p>
                      </div>
                    </div>
                  ),
                  { duration: 4000 },
                );
              }}
            >
              إيقاف استقبال الطلبات
            </Button>
            <Button
              variant="ghost"
              className="text-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setConfirmOpen(false)}
            >
              الرجوع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
