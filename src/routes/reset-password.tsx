import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { AuthAPI } from "@/api";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور - كبسولة" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: ResetPasswordPage,
});

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,}$/;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email: initialEmail } = Route.useSearch();
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const handleResend = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("أدخل البريد الإلكتروني أولاً.");
      return;
    }
    setResending(true);
    try {
      await AuthAPI.forgotPassword({ email: email.trim() });
      setResendSeconds(60);
      setInfo("تم طلب رمز تحقق جديد. تحقق من بريدك الإلكتروني.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إعادة إرسال رمز التحقق.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim()) return setError("أدخل البريد الإلكتروني.");
    if (!otpCode.trim()) return setError("أدخل رمز التحقق المرسل إلى بريدك.");
    if (!PASSWORD_RULE.test(password)) {
      return setError("كلمة المرور يجب أن تكون 12 حرفاً على الأقل، وتتضمن حرفاً صغيراً وكبيراً ورقماً ورمزاً خاصاً.");
    }
    if (password !== confirm) return setError("كلمة المرور وتأكيدها غير متطابقين.");

    setSending(true);
    try {
      await AuthAPI.resetPassword({ email: email.trim(), otpCode: otpCode.trim(), newPassword: password });
      setDone(true);
      window.setTimeout(() => navigate({ to: "/login" }), 2500);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر تغيير كلمة المرور. تحقق من رمز التحقق وحاول مرة أخرى.");
    } finally {
      setSending(false);
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
            <p className="text-sm text-muted-foreground">تم تأكيد نجاح العملية من الخادم. سيتم تحويلك إلى صفحة تسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 text-right">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">إعادة تعيين كلمة المرور</h1>
              <p className="text-sm text-muted-foreground">أدخل رمز التحقق ثم كلمة المرور الجديدة.</p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium">البريد الإلكتروني</span>
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)}
                className="w-full h-12 rounded-full border border-border bg-background px-5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">رمز التحقق (OTP)</span>
              <input inputMode="numeric" autoComplete="one-time-code" required value={otpCode} onChange={(event) => setOtpCode(event.target.value)}
                placeholder="أدخل رمز التحقق" className="w-full h-12 rounded-full border border-border bg-background px-5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>

            <div className="relative">
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password}
                onChange={(event) => setPassword(event.target.value)} placeholder="كلمة المرور الجديدة"
                className="w-full h-12 rounded-full border border-border bg-background px-5 pl-12 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <input type={showConfirm ? "text" : "password"} autoComplete="new-password" required value={confirm}
                onChange={(event) => setConfirm(event.target.value)} placeholder="تأكيد كلمة المرور الجديدة"
                className="w-full h-12 rounded-full border border-border bg-background px-5 pl-12 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button type="button" aria-label={showConfirm ? "إخفاء التأكيد" : "إظهار التأكيد"}
                onClick={() => setShowConfirm((value) => !value)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {info && <p role="status" className="text-sm text-primary">{info}</p>}

            <button type="submit" disabled={sending}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              {sending ? "جارٍ تغيير كلمة المرور..." : "تعيين كلمة المرور الجديدة"}
            </button>

            <button type="button" disabled={resending || resendSeconds > 0}
              onClick={() => void handleResend()}
              className="w-full text-sm text-primary underline disabled:cursor-not-allowed disabled:opacity-50">
              {resending ? "جارٍ إعادة الإرسال..." : resendSeconds > 0 ? `إعادة إرسال الرمز بعد ${resendSeconds} ثانية` : "إعادة إرسال رمز التحقق"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
