import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type OfferSuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoToOrders: () => void;
  onWithdraw: () => void;
};

export function OfferSuccessDialog({
  open,
  onOpenChange,
  onGoToOrders,
  onWithdraw,
}: OfferSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        aria-describedby="offer-success-description"
        overlayClassName="bg-black/50"
        closeButtonLabel="إغلاق إشعار نجاح تقديم العرض"
        closeButtonClassName="left-3 right-auto top-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#737a76] p-0 text-[#737a76] opacity-100 hover:bg-[#f6f7f6] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-[#285849] [&>svg]:h-4 [&>svg]:w-4"
        className="h-[188px] max-h-[calc(100dvh-2rem)] w-[444px] max-w-[calc(100vw-2rem)] grid-rows-[1fr_auto] gap-0 overflow-hidden rounded-[8px] border border-[#e6e8e6] bg-white p-0 text-[#3f4542] shadow-[0_12px_36px_rgba(0,0,0,0.18)]"
      >
        <div className="min-h-0 px-5 pb-2 pt-4">
          <DialogTitle className="flex items-center gap-2 text-right text-[22px] font-medium leading-[1.3] text-[#168a67]">
            <Check className="h-6 w-6 shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span>تم تقديم العرض بنجاح!</span>
          </DialogTitle>
          <DialogDescription
            id="offer-success-description"
            className="mt-2 text-right text-sm leading-5 text-[#343a37]"
          >
            تم تسجيل عرضك ضمن المزايدة المفتوحة. يمكنك تعديله أو سحبه، وتأكيد المنتج البديل من
            تفاصيل الطلب.
          </DialogDescription>
        </div>

        <div className="flex h-12 items-center gap-3 border-t border-[#e7e9e7] px-4">
          <button
            type="button"
            onClick={onWithdraw}
            className="shrink-0 text-sm font-medium text-[#60786e] transition-colors hover:text-[#285849] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#285849] focus-visible:ring-offset-2"
          >
            سحب العرض
          </button>
          <button
            type="button"
            onClick={onGoToOrders}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-[9px] bg-[#064b3b] px-3 text-sm font-medium text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#073e33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#285849] focus-visible:ring-offset-2"
          >
            الذهاب للطلبات
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
