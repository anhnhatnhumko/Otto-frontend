"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AmountSelector from "@/components/wallet/AmountSelector";
import PaymentMethodSelector from "@/components/wallet/PaymentMethodSelector";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { NEXT_ACTION_NOT_FOUND_HEADER } from "next/dist/client/components/app-router-headers";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

const Deposit = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [isConfirming, setIsConfirming] = useState(false);
  const [balance, setBalance] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const finalAmount = customAmount
    ? parseInt(customAmount, 10)
    : selectedAmount;
  const isValid = finalAmount && finalAmount >= 10000;

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleDeposit = async () => {
    console.log("🔥 SEND AMOUNT:", finalAmount);
    if (!finalAmount) return;

    setIsConfirming(true);

    try {
      const res = await fetch(
        `/api/wallet/deposit`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: finalAmount,
            method: "STRIPE",
          }),
        },
      );

      const data = await res.json();

      console.log("🔥 DEPOSIT RESPONSE:", data);

      if (!data.checkoutUrl && !data.paymentUrl) {
        console.error("❌ INVALID checkoutUrl:", data.checkoutUrl);
        console.error("❌ INVALID paymentUrl:", data.paymentUrl);
        return; 
      }

      // 🔥 REDIRECT STRIPE
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    const fetchWallet = async () => {
      const res = await fetch(`/api/wallet`, {
        credentials: "include",
      });

      const data = await res.json();
      setBalance(data.balance || 0);
    };

    fetchWallet();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="bg-navy text-color-inverted">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center hover:bg-navy-light/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Nạp tiền</h1>
            <p className="text-xs opacity-70">Nạp tiền vào tài khoản của bạn</p>
          </div>
        </div>
      </div>

      {/* Balance banner */}
      <div className="max-w-lg mx-auto px-4 -mt-0">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-5 mt-4 text-primary-foreground">
          <p className="text-sm opacity-80">Số dư hiện tại</p>
          <p className="text-3xl font-bold mt-1">{formatVND(balance)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <AmountSelector
          selectedAmount={selectedAmount}
          customAmount={customAmount}
          onSelectPreset={handlePresetSelect}
          onCustomAmountChange={handleCustomChange}
        />

        <PaymentMethodSelector
          selected={paymentMethod}
          onSelect={setPaymentMethod}
        />

        {/* Summary */}
        {isValid && (
          <div className="overflow-hidden">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="font-semibold text-foreground">
                  {formatVND(finalAmount!)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí giao dịch</span>
                <span className="font-semibold text-success">Miễn phí</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">
                  Tổng thanh toán
                </span>
                <span className="font-bold text-lg text-foreground">
                  {formatVND(finalAmount!)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="space-y-3 pb-8">
          <Button
            variant="accent"
            size="lg"
            className="w-full h-14 rounded-xl text-base"
            disabled={!isValid || isConfirming}
            onClick={handleDeposit}
          >
            {isConfirming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Nạp tiền {isValid && `· ${formatVND(finalAmount!)}`}</>
            )}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span>Giao dịch được bảo mật & mã hóa SSL</span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Deposit;
