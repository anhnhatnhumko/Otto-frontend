import { Button } from "@/components/ui/button";
const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

interface AmountSelectorProps {
  selectedAmount: number | null;
  customAmount: string;
  onSelectPreset: (amount: number) => void;
  onCustomAmountChange: (value: string) => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
};

const AmountSelector = ({
  selectedAmount,
  customAmount,
  onSelectPreset,
  onCustomAmountChange,
}: AmountSelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Chọn số tiền
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {PRESET_AMOUNTS.map((amount) => (
          <div key={amount}>
            <Button
              variant="outline"
              className={`w-full h-14 rounded-xl text-sm ${
                selectedAmount === amount && !customAmount
                  ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
              onClick={() => onSelectPreset(amount)}
            >
              {formatVND(amount)}
            </Button>
          </div>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Nhập số tiền khác..."
          value={customAmount}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            onCustomAmountChange(raw);
          }}
          className="w-full h-14 rounded-xl border-2 border-border bg-card px-4 text-foreground text-lg font-semibold placeholder:text-muted-foreground/50 placeholder:font-normal placeholder:text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
        />
        {customAmount && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            VNĐ
          </span>
        )}
      </div>
    </div>
  );
};

export default AmountSelector;
