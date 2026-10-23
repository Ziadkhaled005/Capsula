import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Upload, ChevronLeft, ChevronRight, X, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import searchIllustration from "@/assets/search-illustration.png";
import dropdownIcon from "@/assets/dropdown-icon.png";
import { cn } from "@/lib/utils";
import { useUpload } from "@/contexts/upload-context";
import { InventoryAPI, SuperAdminAPI, isApiConfigured } from "@/api";
import type { JsonRecord } from "@/api/contracts";
import { formatDate } from "@/lib/datetime";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type Item = {
  name: string;
  category: string;
  stockCurrent: number;
  updated: string;
  price: number;
  code: string;
};

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="rounded px-0.5" style={{ backgroundColor: "#FFB005", color: "#000" }}>{part}</mark>
      : part
  );
}

export const Route = createFileRoute("/pharmacy/inventory")({
  head: () => ({ meta: [{ title: "المخزون - لوحة الصيدلية" }] }),
  component: InventoryPage,
});

const previewColumns = ["تفاصيل المنتج", "الفئة", "المخزون الحالي", "اخر تحديث", "السعر", "الكود"];
const previewRows: string[][] = [];

const MAX_SIZE = 3 * 1024 * 1024;

function UploadModal({ onClose }: { onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setUploadNotification, setShowSuccessAlert, enforceMaxSize } = useUpload();

  const isError = sizeError || typeError;

  function handleFile(f: File) {
    const validTypes = ["text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
    const validExt = /\.(csv|xlsx|xls)$/i.test(f.name);
    if (!validTypes.includes(f.type) && !validExt) {
      setTypeError(true);
      setSizeError(false);
      setFile(null);
    } else if (enforceMaxSize && f.size > MAX_SIZE) {
      setSizeError(true);
      setTypeError(false);
      setFile(null);
    } else {
      setSizeError(false);
      setTypeError(false);
      setFile(f);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <button onClick={onClose} className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center text-foreground/60 hover:bg-muted/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">رفع تحديث المخزون</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-lg bg-[#E5F6FD] px-4 py-3">
            <Info className="h-5 w-5 text-[#0288D1] shrink-0 mt-0.5" />
            <p className="text-sm text-[#014361] leading-relaxed text-right">
              يرجى رفع ملف بصيغة <strong>.xlsx</strong> أو <strong>.csv</strong> يحتوي على بيانات المخزون المحدثة. تأكد من أن الأعمدة تطابق النموذج المعروض أدناه.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center py-10 gap-3 cursor-pointer",
              isError
                ? "border-[#BA1A1A] bg-[#D32F2F]/[0.04]"
                : dragOver ? "border-primary bg-primary/5" : "border-border"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", isError ? "bg-[#BA1A1A]/10" : "bg-primary/10")}>
              <Upload className={cn("h-6 w-6", isError ? "text-[#BA1A1A]" : "text-primary")} />
            </div>
            <>
              <p className="text-sm text-foreground">
                اسحب الملف هنا أو{" "}
                <span className="text-primary underline underline-offset-2 cursor-pointer">اختر ملفاً</span>
              </p>
              <p className="text-xs text-muted-foreground">يدعم ملفات xlsx و csv</p>
              <p className="text-xs text-muted-foreground">الحجم الأقصى للملف: 3.0 MB</p>
            </>
            {file && (
              <div
                className="flex items-center gap-2 mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setFile(null)}
                  className="h-7 w-7 rounded-lg border border-black/30 flex items-center justify-center hover:bg-muted/50 transition-colors shrink-0"
                  aria-label="إزالة الملف"
                >
                  <X className="h-3.5 w-3.5 text-foreground/60" />
                </button>
                <span className="text-sm text-foreground/80 truncate max-w-[280px]">{file.name}</span>
              </div>
            )}
            {sizeError && (
              <p className="text-xs font-medium text-[#BA1A1A] mt-1">
                حجم الملف يتجاوز الحد المسموح به (3.0 MB). يرجى اختيار ملف أصغر.
              </p>
            )}
            {typeError && (
              <p className="text-xs font-medium text-[#BA1A1A] mt-1">
                صيغة الملف غير مدعومة. يرجى رفع ملف بصيغة .xlsx أو .csv فقط.
              </p>
            )}
          </div>

          {/* Preview Table */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="bg-[#CFD8DC] px-4 py-2">
              <p className="text-xs font-medium text-foreground/70 text-right">نموذج البيانات المطلوبة</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b border-border bg-[#ECEFF1]">
                    {previewColumns.map((col) => (
                      <th key={col} className="text-right font-medium text-foreground/70 py-2.5 px-3 whitespace-nowrap border-l border-border/50 last:border-l-0">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className={cn("border-b border-border last:border-b-0", i % 2 === 1 && "bg-[#ECEFF1]/50")}>
                      {row.map((cell, j) => (
                        <td key={j} className="py-2.5 px-3 text-right text-foreground/80 whitespace-nowrap border-l border-border/50 last:border-l-0">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-border bg-muted/20 flex-row-reverse">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2.5 rounded-full border border-border text-sm text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            disabled={!file || uploading}
            onClick={async () => {
              if (!file) return;
              setUploading(true);
              try {
                await InventoryAPI.uploadInventory(file);
                setUploadNotification({ filename: file.name });
                setUploading(false);
                onClose();
                setTimeout(() => {
                  setUploadNotification(null);
                  setShowSuccessAlert(true);
                }, 3000);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "تعذر رفع ملف المخزون.");
                setUploading(false);
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            رفع الملف
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("كل الفئات");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [categoryList, setCategoryList] = useState<JsonRecord[]>([]);
  const categoryRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query);
  const categoryId = categoryList.find((c) => c.name === selectedCategory)?.id as number | undefined;

  useEffect(() => {
    SuperAdminAPI.getCategories()
      .then(setCategoryList)
      .catch(() => setCategoryList([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, categoryId]);

  useEffect(() => {
    let current = true;

    async function loadInventory() {
      setLoading(true);
      setLoadError("");
      if (!isApiConfigured) {
        setLoadError("لم يتم ربط واجهة API الحقيقية بعد.");
        setLoading(false);
        return;
      }
      try {
        const response = await InventoryAPI.getInventory({
          search: debouncedQuery.trim() || undefined,
          categoryId,
          page,
          pageSize,
        });
        if (!current) return;
        setItems(
          response.items.map((item) => ({
            name: item.productName,
            category: item.categoryName ?? "غير مصنف",
            stockCurrent: item.quantity,
            updated: formatDate(item.lastUpdated),
            price: item.price,
            code: String(item.productId),
          })),
        );
        setTotalItems(response.totalCount);
      } catch (error) {
        if (current) setLoadError(error instanceof Error ? error.message : "تعذر تحميل المخزون.");
      } finally {
        if (current) setLoading(false);
      }
    }

    void loadInventory();
    return () => {
      current = false;
    };
  }, [reloadKey, debouncedQuery, categoryId, page, pageSize]);

  const categories = ["كل الفئات", ...categoryList.map((category) => String(category.name))];
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div dir="rtl">
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
      <div className="text-right mb-8">
        <h1 className="text-3xl font-bold text-foreground">المخزون</h1>
        <p className="text-muted-foreground mt-2 text-sm">متابعة وإدارة مخزون الأدوية والمنتجات</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        {/* Toolbar */}
        <div className="flex gap-4 mb-6 flex-wrap text-left justify-end items-center flex-row">
          <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
            <div className="relative" ref={categoryRef}>
              <span className="absolute -top-2 right-5 bg-card px-1.5 text-xs text-muted-foreground z-10">
                الفئة
              </span>
              <button
                onClick={() => setCategoryOpen((o) => !o)}
                className="inline-flex items-center gap-3 rounded-full border border-border bg-card pl-3 pr-5 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors min-w-[170px] justify-between flex-row-reverse"
              >
                <span>{selectedCategory}</span>
                <span className="h-7 w-7 rounded-full border border-border flex items-center justify-center">
                  <img src={dropdownIcon} alt="" className={cn("h-4 w-4 object-contain transition-transform", categoryOpen && "rotate-180")} />
                </span>
              </button>
              {categoryOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 min-w-[170px] rounded-xl border border-border bg-card shadow-lg py-1 text-sm" dir="rtl">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                      className={cn(
                        "w-full text-right px-4 py-2.5 hover:bg-muted/50 transition-colors",
                        selectedCategory === cat && "text-primary font-medium"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="البحث بأسم المنتج"
                className="w-full rounded-full border border-border bg-background pr-11 pl-10 py-2.5 text-sm text-right placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80"
                  aria-label="مسح البحث"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setUploadOpen(true)} className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors">
              رفع تحديث المخزون
            </button>
            <button className="text-sm text-foreground hover:text-primary transition-colors">
              طباعة المخزون
            </button>
          </div>
        </div>



        {/* Table */}
        <div className="border-t border-border -mx-6">
          <table className="w-full text-sm" dir="rtl">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-right font-normal py-4 px-6">تفاصيل المنتج</th>
                <th className="text-right font-normal py-4 px-2 border-r border-border">الفئة</th>
                <th className="text-right font-normal py-4 px-2">المخزون الحالي</th>
                <th className="text-right font-normal py-4 px-2">اخر تحديث</th>
                <th className="text-right font-normal py-4 px-2">السعر</th>
                <th className="text-right font-normal py-4 px-6">الكود</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Search and category are filtered server-side.
                const filtered = items;
                if (loading || loadError || filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-24 gap-4" dir="rtl">
                          {!loading && !loadError && <img src={searchIllustration} alt="" className="w-28 h-28 object-contain" />}
                          <div className="text-center">
                            <p className="text-base font-semibold text-foreground">
                              {loading ? "جارٍ تحميل المخزون..." : loadError ? loadError : "لا توجد بيانات مخزون حقيقية متاحة"}
                            </p>
                            {!loading && !loadError && (
                              <p className="text-sm text-muted-foreground mt-1">ستظهر المنتجات بعد وصول بيانات حقيقية من الخادم.</p>
                            )}
                            {loadError && (
                              <button
                                type="button"
                                onClick={() => setReloadKey((key) => key + 1)}
                                className="mt-3 text-sm font-medium text-primary underline"
                              >
                                إعادة المحاولة
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return filtered.map((it, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3 justify-start">
                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/20" />
                        </div>
                        <span className="text-foreground text-right max-w-[180px] leading-snug">{highlight(it.name, query)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right text-foreground border-r border-border">{it.category}</td>
                    <td className="py-4 px-2 text-right text-foreground">
                      <span className="font-bold">{it.stockCurrent}</span>
                    </td>
                    <td className="py-4 px-2 text-right text-foreground">{it.updated}</td>
                    <td className="py-4 px-2 text-right text-foreground">{it.price.toFixed(2)} ج.م / عبوة</td>
                    <td className="py-4 px-6 text-right text-foreground">{it.code}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border pt-4 flex items-center justify-end gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <button className="inline-flex items-center gap-1 px-2 py-1 hover:bg-muted/50 rounded">
              <span>10</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>عرض {items.length} من {totalItems}</div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted/50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 rounded flex items-center justify-center hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
