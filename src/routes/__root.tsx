import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

// Create one shared QueryClient for the entire application.
const queryClient = new QueryClient();

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4" dir="rtl">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">الصفحة غير موجودة</h2>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
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
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "كبسولة - لوحة التحكم" },
      {
        name: "description",
        content: "نظام إدارة الصيدليات والمخزون",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap",
      },
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

function RootComponent() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  const isStandalonePage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/email-sent" ||
    pathname === "/reset-password" ||
    pathname === "/pharmacy" ||
    pathname.startsWith("/pharmacy/") ||
    pathname.startsWith("/customer/order/");

  return (
    <QueryClientProvider client={queryClient}>
      {isStandalonePage ? (
        <div className="min-h-screen bg-background" dir="rtl">
          <Outlet />
        </div>
      ) : (
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <main className="flex-1 p-8 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      )}
    </QueryClientProvider>
  );
}
