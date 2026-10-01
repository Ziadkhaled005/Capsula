import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export function TableShell({
  title,
  filters,
  children,
  pagination,
}: {
  title: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
        {filters && <div className="flex items-center gap-3">{filters}</div>}
        <h2 className="text-lg font-semibold text-foreground text-right">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
      <TablePagination pagination={pagination} />
    </div>
  );
}

export function TablePagination({
  pagination,
}: {
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 10;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const goPrev = () => pagination && page > 1 && pagination.onPageChange(page - 1);
  const goNext = () => pagination && page < totalPages && pagination.onPageChange(page + 1);

  return (
    <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-border text-sm text-muted-foreground">
      <button
        onClick={goPrev}
        disabled={!pagination || page <= 1}
        className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={goNext}
        disabled={!pagination || page >= totalPages}
        className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span>
        {pagination ? `Page ${page} of ${totalPages}` : "Page 1 of 1"}
      </span>
      <div className="flex items-center gap-1 mr-2">
        <span>{pageSize}</span>
        <ChevronDown className="h-3 w-3" />
        <span>Rows per page:</span>
      </div>
    </div>
  );
}
