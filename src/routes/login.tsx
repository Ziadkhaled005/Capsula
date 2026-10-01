import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const passwordTooShort = password.trim().length > 0 && password.length < 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || password.length < 8) {
      setError(true);
      return;
    }
    setError(false);
    if (email === "admin@admin.com" && password === "123456789") {
      navigate({ to: "/pharmacy.index" });
    } else {
      navigate({ to: "/pharmacy" });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2" dir="rtl">
      {/* Right side (visual) - first in RTL */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden order-first">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative flex flex-col items-center gap-2 self-start">
          <img src={capsuleLogo} alt="Capsula" className="h-14 w-auto -rotate-45" />
          <div className="text-center leading-tight">
            <div className="text-3xl font-light">Capsula</div>
            <div className="text-sm opacity-90">كبسولة</div>
          </div>
        </div>
        <div className="relative text-right">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            كل اللي تحتاجه لإدارة الطلبات
            <br />
            والمخزون... في كبسولة واحدة.
          </h2>
        </div>
      </div>

      {/* Left side (form) */}
      <div className="flex items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 text-right">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">أدر صيدليتك بسهولة من أي مكان.</p>
          </div>

          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className={`w-full h-12 rounded-full border bg-background px-5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                error && !email.trim()
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border focus:ring-primary/30"
              }`}
            />
            <div className="space-y-1">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className={`w-full h-12 rounded-full border bg-background px-5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  (error && !password.trim()) || passwordTooShort
                    ? "border-destructive focus:ring-destructive/30"
                    : "border-border focus:ring-primary/30"
                }`}
              />

              <button
                type="button"
                onClick={() => navigate({ to: "/forgot-password" })}
                className="text-xs text-primary hover:underline px-2"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          </div>

          {error && (!email.trim() || !password.trim()) && (
            <div className="rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm px-4 py-3 text-right">
              برجاء ادخال المستخدم و كلمة السر
            </div>
          )}

          {passwordTooShort && (
            <div className="rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm px-4 py-3 text-right">
              كلمة السر يجب أن تكون 8 أحرف على الأقل
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || password.length < 8}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
