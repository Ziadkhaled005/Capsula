export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8">
      {actions && <div className="flex items-center gap-3">{actions}</div>}
      <div className="text-right">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
