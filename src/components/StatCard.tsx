import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: "primary" | "danger" | "purple";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-destructive/10 text-destructive",
    purple: "bg-[oklch(0.92_0.05_300)] text-[oklch(0.45_0.15_300)]",
  };
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", colorMap[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
      <div className="mt-6 text-right">
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
