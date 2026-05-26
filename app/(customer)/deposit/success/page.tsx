"use client";

import { CheckCircle2, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

const DepositSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const transactionId = searchParams.get("transactionId");

  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return;

      try {
        
        const res = await fetch(
          `/api/wallet/transactions`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        // tìm transaction đúng
        const tx = data.find((t: any) => t._id === transactionId);

        if (tx) {
          setAmount(tx.amount);
        }
      } catch (err) {
        console.error("Fetch transaction error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="bg-navy text-color-inverted min-h-[60px]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/deposit")}
            className="w-10 h-10 rounded-xl bg-navy-light flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Kết quả giao dịch</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Nạp tiền thành công!</h2>
            <p className="text-muted-foreground">
              Giao dịch của bạn đã được xử lý thành công.
            </p>
          </div>

          {!loading && amount > 0 && (
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Số tiền nạp</span>
                <span className="font-semibold">
                  {formatVND(amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trạng thái</span>
                <span className="font-semibold text-primary">Thành công</span>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Button
              className="w-full h-14"
              onClick={() => router.push("/deposit")}
            >
              Nạp thêm tiền
            </Button>

            <Button
              variant="outline"
              className="w-full h-14"
              onClick={() => router.push("/")}
            >
              <Home className="w-5 h-5 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositSuccess;