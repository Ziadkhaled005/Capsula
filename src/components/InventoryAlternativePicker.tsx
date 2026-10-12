import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Package, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InventoryAPI, isMockMode } from "@/api";
import { MOCK_INVENTORY } from "@/mock/inventory";
import type { InventoryItem } from "@/types";
import type { OrderItem } from "@/routes/pharmacy.orders";
import panadolAdvance from "../../attached_assets/offer-panadol-advance.png";
import panadolExtra from "../../attached_assets/offer-panadol-extra.png";
import panadolHeadache from "../../attached_assets/offer-panadol-headache.png";
import panadolNight from "../../attached_assets/offer-panadol-night.png";

type InventoryAlternativePickerProps = {
  requestedProduct: OrderItem;
  onClose: () => void;
  onChoose: (alternatives: InventoryItem[]) => void;
};

const localProductImages: Array<{ match: string; image: string }> = [
  { match: "نايت", image: panadolNight },
  { match: "اكسترا", image: panadolExtra },
  { match: "صداع", image: panadolHeadache },
  { match: "ادفانس", image: panadolAdvance },
];

function getProductImage(item: InventoryItem) {
  if (item.imageUrl) return item.imageUrl;

  const normalizedName = item.name.replace(/[أإآ]/g, "ا");
  return localProductImages.find(({ match }) => normalizedName.includes(match))?.image;
}

function normalizeProductName(name: string) {
  return name
    .split(/[،,]/, 1)[0]
    .replace(/باندول/g, "بانادول")
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function InventoryAlternativePicker({
  requestedProduct,
  onClose,
  onChoose,
}: InventoryAlternativePickerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let current = true;

    const loadInventory = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const response = isMockMode
          ? { data: MOCK_INVENTORY }
          : await InventoryAPI.getInventory({ stockStatus: "in-stock", pageSize: 100 });

        if (current) {
          const requestedName = normalizeProductName(requestedProduct.name);
          setInventory(
            response.data.filter(
              (item) => item.stockCurrent > 0 && normalizeProductName(item.name) !== requestedName,
            ),
          );
        }
      } catch {
        if (current) setLoadError(true);
      } finally {
        if (current) setLoading(false);
      }
    };

    void loadInventory();
    return () => {
      current = false;
    };
  }, [requestedProduct.name, retryKey]);

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return inventory;

    return inventory.filter((item) =>
      [item.name, item.sku, item.category].some((value) =>
        value.toLocaleLowerCase().includes(query),
      ),
    );
  }, [inventory, search]);

  const toggleSelection = (item: InventoryItem) => {
    setSelected((current) =>
      current.some((selectedItem) => selectedItem.id === item.id)
        ? current.filter((selectedItem) => selectedItem.id !== item.id)
        : [...current, item],
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        dir="rtl"
        overlayClassName="bg-black/40"
        closeButtonLabel="إغلاق"
        closeButtonClassName="left-5 right-auto top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[#d4d7d5] bg-white p-0 text-[#4c514f] opacity-100 hover:bg-[#f5f6f5]"
        className="flex h-[min(476px,calc(100dvh-24px))] w-[min(600px,calc(100vw-24px))] max-w-none flex-col gap-0 overflow-hidden rounded-md border border-[#dedfdf] bg-white p-0 text-[#343a37] shadow-[0_12px_36px_rgba(0,0,0,0.16)] sm:rounded-md"
      >
        <DialogHeader className="relative min-h-[72px] shrink-0 justify-center space-y-0 border-b border-[#e0e1e0] px-6 py-4 text-right sm:text-right">
          <DialogTitle className="text-right text-[18px] font-normal leading-6">
            اقتراح بديل — {requestedProduct.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            اختر منتجات متاحة من المخزون كبدائل للمنتج غير المتوفر.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-x-reverse divide-[#e1e2e1] overflow-hidden">
          <section className="flex min-w-0 flex-col overflow-hidden" aria-label="المخزون">
            <div className="shrink-0 p-3.5">
              <div className="relative">
                <Search
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#48504d]"
                  aria-hidden="true"
                />
                <input
                  autoFocus
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="بحث"
                  aria-label="بحث في المخزون"
                  className="h-10 w-full rounded-full border border-[#8c9290] bg-white py-2 pl-4 pr-10 text-right text-sm outline-none transition focus:border-[#285849] focus:ring-2 focus:ring-[#285849]/10"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 pb-3.5">
              {loading ? (
                <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-[#777e7a]">
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  جارٍ تحميل المخزون...
                </div>
              ) : loadError ? (
                <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
                  <p className="text-sm text-[#777e7a]">تعذر تحميل المخزون.</p>
                  <button
                    type="button"
                    onClick={() => setRetryKey((key) => key + 1)}
                    className="text-sm font-medium text-[#285849] underline underline-offset-2"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="flex min-h-28 items-center justify-center text-center text-sm text-[#777e7a]">
                  {inventory.length === 0
                    ? "لا توجد منتجات متاحة في المخزون."
                    : "لا توجد منتجات مطابقة للبحث."}
                </div>
              ) : (
                filteredInventory.map((item) => {
                  const isSelected = selected.some((selectedItem) => selectedItem.id === item.id);
                  const image = getProductImage(item);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleSelection(item)}
                      className="flex min-h-[62px] w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-right transition-colors hover:bg-[#f8f9f8]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e5e3] bg-white">
                        {image ? (
                          <img
                            src={image}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-[#818985]" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-right">
                        <span className="block truncate text-[13px] font-medium text-[#303633]">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#737a76]">شريط</span>
                      </span>
                      <span dir="ltr" className="shrink-0 text-xs text-[#454b48]">
                        {item.price.toFixed(2)} ج.م
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="flex min-w-0 flex-col overflow-hidden" aria-label="البدائل المقترحة">
            <div className="shrink-0 px-5 py-4 text-right">
              <h3 className="text-sm font-bold text-[#343a37]">البدائل المقترحة</h3>
              <p className="mt-1 text-xs text-[#777e7a]">اختر على الأقل بديل واحد</p>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
              {selected.map((item) => {
                const image = getProductImage(item);

                return (
                  <div key={item.id} className="flex min-h-[54px] items-center gap-2.5 text-right">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e5e3] bg-white">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          aria-hidden="true"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-[#818985]" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[#303633]">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#737a76]">شريط</span>
                    </span>
                    <span dir="ltr" className="shrink-0 text-xs text-[#454b48]">
                      {item.price.toFixed(2)} ج.م
                    </span>
                    <button
                      type="button"
                      aria-label={`إزالة ${item.name} من البدائل المقترحة`}
                      title="إزالة المنتج"
                      onClick={() =>
                        setSelected((current) =>
                          current.filter((selectedItem) => selectedItem.id !== item.id),
                        )
                      }
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#737a76] transition-colors hover:bg-[#fff0ef] hover:text-[#b84f4d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b84f4d]"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <DialogFooter
          dir="ltr"
          className="h-[56px] shrink-0 flex-row items-center justify-start gap-3 border-t border-[#dedfdf] px-4 py-2 sm:justify-start sm:space-x-0"
        >
          <button
            type="button"
            disabled={selected.length === 0 || loading || loadError}
            onClick={() => onChoose(selected)}
            className="inline-flex h-9 items-center justify-center rounded-full bg-success px-4 text-sm font-medium text-success-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            إضافة البديل للعرض
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[#5c6962] transition-colors hover:text-[#285849]"
          >
            الرجوع
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
