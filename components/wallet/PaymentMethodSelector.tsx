
import { Building2, Wallet, CreditCard } from "lucide-react";

const METHODS = [
//   { id: "bank", label: "Chuyển khoản ngân hàng", icon: Building2, desc: "Miễn phí" },
  { id: "stripe", label: "Thanh toán qua Stripe", icon: CreditCard, desc: "Visa/Mastercard" },
//   { id: "card", label: "Thẻ Visa/Mastercard", icon: CreditCard, desc: "Phí 1.5%" },
];

interface PaymentMethodSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const PaymentMethodSelector = ({ selected, onSelect }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Phương thức thanh toán
      </h2>
      <div className="space-y-3">
        {METHODS.map((method, i) => {
          const isActive = selected === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                <method.icon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className={`font-semibold text-sm ${isActive ? "text-foreground" : "text-foreground"}`}>
                  {method.label}
                </p>
                <p className="text-xs text-muted-foreground">{method.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isActive ? "border-primary" : "border-border"
                }`}
              >
                {isActive && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
