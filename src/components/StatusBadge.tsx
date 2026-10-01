import { cn } from "@/lib/utils";

type Variant = "success" | "danger" | "warning" | "muted";

const styles: Record<Variant, string> = {
  success:
    "border-success/40 text-success bg-success/5",
  danger:
    "border-destructive/40 text-destructive bg-destructive/10",
  warning:
    "border-warning/50 text-warning-foreground bg-warning/15",
  muted: "border-border text-muted-foreground bg-muted",
};

export function StatusBadge({
  children,
  variant = "muted",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-3 py-1 text-xs font-medium min-w-20",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
