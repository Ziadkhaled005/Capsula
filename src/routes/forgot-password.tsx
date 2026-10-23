import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";
import { AuthAPI, ApiError } from "@/api";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    if (!email.trim()) return;

    setSending(true);
    try {
      await AuthAPI.forgotPassword(email.trim());
      navigate({ to: "/email-sent", search: { email: email.trim() } });
    } catch (error) {
      setSendError(
          error instanceof ApiError
          ? error.message
          : "حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة مرة أخرى.",
      );
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
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 text-right">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">نسيت كلمة المرور</h1>
            <p className="text-sm text-muted-foreground">إعادة تعيين كلمة المرور لحسابك في كبسولة</p>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            required
            className="w-full h-12 rounded-full border border-border bg-background px-5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {sendError && (
            <p className="text-sm text-destructive">{sendError}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                جارٍ الإرسال...
              </>
            ) : (
              "إرسال رمز التحقق"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
