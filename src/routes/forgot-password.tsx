import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import emailjs from "@emailjs/browser";
import capsuleLogo from "@/assets/capsule-logo.png";
import authBg from "@/assets/auth-bg.png";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? "";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? "";

function buildEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#f4f4f4; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction:rtl; }
    .wrapper { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .logo-area { padding:32px 40px 24px; text-align:center; border-bottom:1px solid #f0f0f0; }
    .logo-area img { height:64px; }
    .body { padding:36px 40px; text-align:right; color:#1a1a1a; font-size:15px; line-height:1.8; }
    h2 { margin:0 0 24px; font-size:20px; font-weight:700; color:#1a1a1a; }
    .btn-wrap { text-align:center; margin:28px 0; }
    .btn { display:inline-block; background:#3d7a5e; color:#fff !important; text-decoration:none; padding:14px 36px; border-radius:8px; font-size:15px; font-weight:600; letter-spacing:.3px; }
    ul { padding-right:24px; margin:8px 0 20px; }
    ul li { margin-bottom:6px; }
    .footer { padding:24px 40px; border-top:1px solid #f0f0f0; color:#666; font-size:13px; text-align:right; line-height:1.7; }
    .note { color:#888; font-size:13px; margin-top:20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="logo-area">
      <div style="font-size:28px; font-weight:300; color:#3d7a5e;">Capsula &nbsp;·&nbsp; كبسولة</div>
    </div>
    <div class="body">
      <h2>إعادة تعيين كلمة المرور لحسابك في كبسولة</h2>
      <p>مرحباً 👋،</p>
      <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في كبسولة.</p>
      <p>لإتمام العملية، يرجى الضغط على الزر أدناه لتعيين كلمة مرور جديدة:</p>
      <div class="btn-wrap">
        <a href="${resetLink}" class="btn">إعادة تعيين كلمة المرور</a>
      </div>
      <p>سيتم تحويلك إلى صفحة أمنة تحتوي على الحقول التالية:</p>
      <ul>
        <li>كلمة المرور الجديدة</li>
        <li>تأكيد كلمة المرور الجديدة</li>
      </ul>
      <p class="note">رابط إعادة التعيين صالح لمدة ساعة واحدة فقط من وقت استلام هذا البريد.</p>
      <p class="note">إذا لم تكن أنت من طلب إعادة التعيين، يمكنك تجاهل هذا البريد بأمان.</p>
    </div>
    <div class="footer">
      <p>شكرًا لاستخدامك كبسولة،<br/>🍀 فريق الدعم في كبسولة</p>
      <div style="text-align:center; margin-top:16px;">
        <a href="${resetLink}" style="display:inline-block; background:#3d7a5e; color:#fff; text-decoration:none; padding:12px 32px; border-radius:8px; font-size:14px; font-weight:600;">إعادة تعيين كلمة المرور</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    if (!email.trim()) return;

    const resetLink = `${window.location.origin}/reset-password`;

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      navigate({ to: "/email-sent", search: { email } });
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          reset_link: resetLink,
          message_html: buildEmailHtml(resetLink),
        },
        PUBLIC_KEY,
      );
      navigate({ to: "/email-sent", search: { email } });
    } catch {
      setSendError("حدث خطأ أثناء إرسال البريد. يرجى المحاولة مرة أخرى.");
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
              "إرسال رابط إعادة التعيين"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
