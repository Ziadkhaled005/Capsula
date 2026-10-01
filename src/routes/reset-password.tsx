import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور - كبسولة" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (password !== confirm) {
      setError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/login" }), 2500);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2" dir="rtl">
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden order-first">
        <img src={authBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative flex items-center gap-3 self-end">
          <div className="text-right leading-tight">
            <div className="text-3xl font-light">Capsula</div>
            <div className="text-sm opacity-90">كبسولة</div>
          </div>
          <img src={capsuleLogo} alt="Capsula" className="h-14 w-auto" />
        </div>
        <div className="relative text-right">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            كل اللي تحتاجه لإدارة الطلبات
            <br />
            والمخزون... في كبسولة واحدة.
          </h2>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        {done ? (
          <div className="w-full max-w-md text-right space-y-4">
            <CheckCircle2 className="h-14 w-14 text-primary" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-foreground">تم تغيير كلمة المرور!</h1>
            <p className="text-sm text-muted-foreground">سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 text-right">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">إعادة تعيين كلمة المرور</h1>
              <p className="text-sm text-muted-foreground">أدخل كلمة مرور جديدة لحسابك في كبسولة</p>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                className="w-full h-12 rounded-full border border-border bg-background px-5 pl-12 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="تأكيد كلمة المرور الجديدة"
                className="w-full h-12 rounded-full border border-border bg-background px-5 pl-12 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive text-right">{error}</p>
            )}

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              تعيين كلمة المرور الجديدة
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
