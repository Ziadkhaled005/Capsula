import { Outlet, Link, createRootRoute, HeadContent, Scripts, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { readStoredUser } from "@/hooks/useAuth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "كبسولة - لوحة التحكم" },
      { name: "description", content: "نظام إدارة الصيدليات والمخزون" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <Scripts />
      </body>
    </html>
  );
}

const PUBLIC_PATHS = ["/login", "/forgot-password", "/email-sent", "/reset-password"];

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  // Session guard: the token lives in localStorage, so this can only run in the browser.
  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/customer/")) return;
    const user = readStoredUser();
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    const isPharmacyPath = pathname === "/pharmacy" || pathname.startsWith("/pharmacy/");
    if (user.role === "pharmacist" && !isPharmacyPath) navigate({ to: "/pharmacy", replace: true });
    if (user.role === "admin" && isPharmacyPath) navigate({ to: "/dashboard", replace: true });
  }, [pathname, navigate]);

  useEffect(() => {
    const demoLocalStorageKeys = [
      "capsoula-pharmacy-orders-initial-state",
      "capsoula-pharmacy-submitted-offers",
      "capsoula-pharmacy-offer-approvals",
      "capsoula-pharmacy-order-statuses",
      "capsoula-pharmacy-customer-decision-notification",
    ];
    try {
      for (const key of demoLocalStorageKeys) window.localStorage.removeItem(key);
      window.sessionStorage.removeItem("capsoula:open-submitted-offer-details");
    } catch (error) {
      console.warn("Could not clear stored demo records.", error);
    }
  }, []);

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/email-sent" ||
    pathname === "/reset-password" ||
    pathname === "/pharmacy" ||
    pathname.startsWith("/pharmacy/") ||
    pathname.startsWith("/customer/order/")
  ) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Outlet />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex w-full bg-background" dir="rtl">
      <AppSidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
