import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";
import { AuthAPI, ApiError } from "@/api";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور - كبسولة" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email: initialEmail } = Route.useSearch();
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/^\d{6}$/.test(otpCode)) {
      setError("أدخل البريد الإلكتروني ورمز التحقق المكوّن من 6 أرقام.");
      return;
    }
    if (password !== confirm) {
      setError("كلمة المرور وتأكيدها غير متطابقين.");
      return;
    }
    if (
      password.length < 12 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError("يجب أن تتكون كلمة المرور من 12 حرفاً على الأقل وتشمل حرفاً كبيراً وصغيراً ورقماً ورمزاً.");
      return;
    }
    setSaving(true);
    try {
      await AuthAPI.resetPassword({
        email: email.trim(),
        otpCode,
        newPassword: password,
      });
      setDone(true);
      setTimeout(() => navigate({ to: "/login" }), 2500);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "تعذر إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
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
              <p className="text-sm text-muted-foreground">أدخل رمز التحقق وكلمة مرور جديدة لحسابك في كبسولة</p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="البريد الإلكتروني"
              required
              className="w-full h-12 rounded-full border border-border bg-background px-5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="رمز التحقق المكوّن من 6 أرقام"
              required
              className="w-full h-12 rounded-full border border-border bg-background px-5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور الجديدة"
                autoComplete="new-password"
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
                autoComplete="new-password"
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
              disabled={saving}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {saving ? "جارٍ حفظ كلمة المرور..." : "تعيين كلمة المرور الجديدة"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
