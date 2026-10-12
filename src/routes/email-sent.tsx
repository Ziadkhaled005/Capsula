import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";

export const Route = createFileRoute("/email-sent")({
  component: EmailSentPage,
  validateSearch: (search: Record<string, unknown>) => ({
    email: (search.email as string) || "",
  }),
});

function EmailSentPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/email-sent" });

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
        <div className="w-full max-w-md space-y-6 text-right">
          <MailCheck className="h-12 w-12 text-primary" strokeWidth={1.5} />
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-foreground">تم إرسال البريد الإلكتروني</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى
              {" "}
              <span className="font-medium text-foreground">{email || "بريدك الإلكتروني"}</span>
              . يرجى التحقق من صندوق الوارد الخاص بك واتباع التعليمات لإعادة تعيين كلمة المرور.
            </p>
            <p className="text-xs text-muted-foreground">
              لم يصلك البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها أو حاول مرة أخرى.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
}