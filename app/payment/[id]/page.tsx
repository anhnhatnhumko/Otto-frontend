"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { requireApiUrl } from "@/lib/api-url";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  CheckCircle2,
  Shield,
  Clock,
  MapPin,
  Calendar,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

const Payment = () => {
  const { toast } = useToast();
  // const { id: orderId } = useParams();
  const params = useParams();

  const orderId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  // console.log("🔥 PARAMS:", params);
  // console.log("🔥 PARAM ID:", params.id);
  // console.log("🔥 TYPE:", typeof params.id);
  // console.log("orderId:", orderId);
  const [order, setOrder] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  // const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const router = useRouter();
  const serviceFee = order?.totalPrice || 0;
  const platformFee = 10000;
  const totalAmount = serviceFee;
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  // + platformFee - discount;

  const API_URL = requireApiUrl();

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });

      const data = await res.json();
      setOrder(data);
    };

    const fetchWallet = async () => {
      console.log("🔥 API_URL:", API_URL);
      const res = await fetch(`/api/wallet`, {
        credentials: "include",
      });

      const data = await res.json();

      console.log("🔥 WALLET:", data);

      setWalletBalance(data.balance);
      setWalletLoading(false);
    };

    if (orderId) {
      fetchOrder();
      fetchWallet(); // ✅ BẮT BUỘC
    }
  }, [orderId]);

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "otto50") {
      setDiscount(50000);
      toast({
        title: "Áp dụng thành công!",
        description: "Bạn được giảm 50.000đ cho đơn hàng này.",
      });
    } else if (promoCode.toLowerCase() === "newuser") {
      setDiscount(30000);
      toast({
        title: "Áp dụng thành công!",
        description: "Bạn được giảm 30.000đ cho đơn hàng này.",
      });
    } else {
      toast({
        title: "Mã không hợp lệ",
        description: "Vui lòng kiểm tra lại mã giảm giá.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: "wallet",
      name: "Ví Otto",
      icon: Wallet,
      description: walletLoading
        ? "Đang tải số dư..."
        : `Số dư: ${formatCurrency(walletBalance)} • Ưu tiên trừ ví`,
    },
    {
      id: "stripe",
      name: "Ví Stripe",
      icon: Wallet,
      description: "Thanh toán qua ví điện tử Stripe",
    },
    // {
    //   id: "zalopay",
    //   name: "ZaloPay",
    //   icon: Wallet,
    //   description: "Thanh toán qua ví ZaloPay",
    // },
    // {
    //   id: "vnpay",
    //   name: "VNPay QR",
    //   icon: QrCode,
    //   description: "Quét mã QR để thanh toán",
    // },
    // {
    //   id: "card",
    //   name: "Thẻ tín dụng/Ghi nợ",
    //   icon: CreditCard,
    //   description: "Visa, Mastercard, JCB",
    // },
    // {
    //   id: "bank",
    //   name: "Chuyển khoản ngân hàng",
    //   icon: Building2,
    //   description: "Chuyển khoản trực tiếp",
    // },
    {
      id: "cod",
      name: "Thanh toán khi hoàn thành",
      icon: Clock,
      description: "Thanh toán tiền mặt sau khi dịch vụ hoàn tất",
    },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleWalletPay = async () => {
    try {
      setIsProcessing(true);

      const res = await fetch(`/api/orders/wallet/create-payment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // 🔥 REDIRECT SANG PAGE OTP
      router.push(
        `/payment/wallet-verify?transactionId=${data.transactionId}&orderId=${orderId}&amount=${totalAmount}`,
      );
    } catch (err) {
      toast({
        title: "Lỗi tạo thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (selectedMethod !== "stripe") {
      toast({
        title: "Hiện chỉ hỗ trợ Stripe",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log("🔥 FINAL orderId:", orderId);

      const res = await fetch(`/api/payments/${orderId}/create`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "stripe",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ PAYMENT ERROR:", err);
        throw new Error(err.message);
      }

      const text = await res.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("❌ RESPONSE KHÔNG PHẢI JSON:", text);

        // 👉 fallback nếu backend trả thẳng URL
        if (text.startsWith("http")) {
          window.location.href = text;
          return;
        }

        throw new Error("Invalid response");
      }

      console.log("🔥 PAYMENT RESPONSE:", data);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Thanh toán thất bại",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-8 md:py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h1 className="text-xl font-semibold text-foreground mb-6">
                Chọn phương thức thanh toán
              </h1>

              <RadioGroup
                value={selectedMethod}
                onValueChange={setSelectedMethod}
                className="space-y-3"
              >
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    htmlFor={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? "border-primary bg-otto-primary-light"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <method.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {method.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Wallet Info */}
            {selectedMethod === "wallet" && (
              <div className="bg-card rounded-2xl shadow-card p-6 animate-fade-up">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Thanh toán bằng Ví Otto
                </h2>
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số dư ví</span>
                    <span className="font-medium text-foreground">
                      {walletLoading
                        ? "Đang tải..."
                        : formatCurrency(walletBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Cần thanh toán
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                  {walletBalance >= totalAmount ? (
                    <>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="text-muted-foreground">
                          Số dư sau thanh toán
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(walletBalance - totalAmount)}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Đủ số dư để thanh toán
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="text-muted-foreground">Còn thiếu</span>
                        <span className="font-medium text-destructive">
                          {formatCurrency(totalAmount - walletBalance)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Trừ {formatCurrency(walletBalance)} từ ví, phần còn lại
                        thanh toán bằng phương thức khác.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Card Details */}
            {selectedMethod === "card" && (
              <div className="bg-card rounded-2xl shadow-card p-6 animate-fade-up">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Thông tin thẻ
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Số thẻ</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                      maxLength={19}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Tên trên thẻ</Label>
                    <Input
                      id="cardName"
                      placeholder="NGUYEN VAN A"
                      value={cardName}
                      onChange={(e) =>
                        setCardName(e.target.value.toUpperCase())
                      }
                      className="h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Ngày hết hạn</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) =>
                          setCardExpiry(formatExpiry(e.target.value))
                        }
                        maxLength={5}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(
                            e.target.value.replace(/\D/g, "").slice(0, 3),
                          )
                        }
                        maxLength={3}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Info */}
            {selectedMethod === "bank" && (
              <div className="bg-card rounded-2xl shadow-card p-6 animate-fade-up">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Thông tin chuyển khoản
                </h2>
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngân hàng</span>
                    <span className="font-medium text-foreground">
                      Vietcombank
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tài khoản</span>
                    <span className="font-medium text-foreground">
                      1234567890123
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chủ tài khoản</span>
                    <span className="font-medium text-foreground">
                      CÔNG TY OTTO
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nội dung CK</span>
                    <span className="font-medium text-primary">
                      OT{Date.now().toString().slice(-8)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Vui lòng chuyển khoản đúng nội dung để đơn hàng được xử lý
                  nhanh nhất.
                </p>
              </div>
            )}

            {/* QR Code for VNPay */}
            {selectedMethod === "vnpay" && (
              <div className="bg-card rounded-2xl shadow-card p-6 animate-fade-up text-center">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Quét mã QR để thanh toán
                </h2>
                <div className="w-48 h-48 bg-muted rounded-xl mx-auto flex items-center justify-center mb-4">
                  <QrCode className="w-32 h-32 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Mở ứng dụng ngân hàng hoặc ví điện tử để quét mã
                </p>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700">
                Thanh toán được bảo mật bởi công nghệ mã hóa SSL 256-bit
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-card p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Thông tin đơn hàng
              </h2>

              <div className="p-4 bg-muted rounded-xl mb-4">
                <h3 className="font-medium text-foreground mb-2">
                  {order?.serviceSnapshot?.name}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Calendar size={14} />
                    {order?.scheduleTime &&
                      new Date(order?.scheduleTime).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock size={14} />
                    {order?.startTime &&
                      order?.endTime &&
                      `${new Date(order.startTime).toLocaleTimeString("vi-VN")} - ${new Date(order.endTime).toLocaleTimeString("vi-VN")}`}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={14} />
                    {order?.addressDetail}
                  </p>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                <Label htmlFor="promo" className="text-sm">
                  Mã giảm giá
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="promo"
                    placeholder="Nhập mã"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="h-10"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyPromo}
                    className="shrink-0"
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 py-4 border-y border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí dịch vụ</span>
                  <span className="text-foreground">
                    {formatCurrency(serviceFee)}
                  </span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí nền tảng</span>
                  <span className="text-foreground">
                    {formatCurrency(platformFee)}
                  </span>
                </div> */}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center py-4">
                <span className="font-semibold text-foreground">Tổng cộng</span>
                <span className="text-xl font-bold text-gradient">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={
                  selectedMethod === "wallet" ? handleWalletPay : handlePayment
                }
                disabled={
                  isProcessing ||
                  (selectedMethod === "wallet" && walletBalance < totalAmount)
                }
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  `Thanh toán ${formatCurrency(totalAmount)}`
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Bằng việc thanh toán, bạn đồng ý với{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Điều khoản dịch vụ
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
