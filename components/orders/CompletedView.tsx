import { useState } from "react";
import { Star, CheckCircle2, RotateCcw, Receipt, Download, Printer, X, FileText, Clock, MapPin, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Order } from "./types";

interface CompletedViewProps {
  order: Order;
  onRate?: (rating: number, review: string) => void;
  onRebook?: () => void;
}

const CompletedView = ({ order, onRate, onRebook }: CompletedViewProps) => {
  const [rating, setRating] = useState(order.rating || 0);
  const [review, setReview] = useState(order.review || "");
  const [submitted, setSubmitted] = useState(!!order.rating);
  const [showInvoice, setShowInvoice] = useState(false);
  const tasker = order.tasker;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const platformFee = 10000;
  const serviceFee = order.price - platformFee;
  const invoiceNumber = `INV-${order._id.replace("ORD-", "")}`;

  const handleSubmit = () => {
    if (rating > 0) {
      onRate?.(rating, review);
      setSubmitted(true);
    }
  };

  return (
    <>
      <Card className="border-green-200 overflow-hidden">
        <div className="h-1.5 bg-green-500" />
        
        <CardContent className="p-6 space-y-5">
          {/* Success icon */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200 mb-2">
              Hoàn thành
            </Badge>
            <h3 className="text-lg font-bold text-foreground">{order.service}</h3>
            <p className="text-sm text-muted-foreground mt-1">{order.date} • {order.time}</p>
          </div>

          {/* Price summary */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Dịch vụ</span>
              <span className="text-foreground">{order.service}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tasker</span>
              <span className="text-foreground">{tasker?.name || "—"}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex justify-between font-bold">
              <span className="text-foreground">Tổng thanh toán</span>
              <span className="text-primary">{formatCurrency(order.price)}</span>
            </div>
          </div>

          {/* Rating section */}
          {!submitted ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground text-center">
                Đánh giá trải nghiệm của bạn
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star
                      size={32}
                      className={star <= rating 
                        ? "text-yellow-500 fill-yellow-500" 
                        : "text-muted-foreground/30"
                      }
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <>
                  <Textarea
                    placeholder="Chia sẻ cảm nhận của bạn (không bắt buộc)..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={3}
                  />
                  <Button variant="hero" className="w-full" onClick={handleSubmit}>
                    Gửi đánh giá
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center p-3 bg-green-50 dark:bg-green-500/10 rounded-xl">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ⭐ Cảm ơn bạn đã đánh giá {rating}/5 sao!
              </p>
              {review && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{review}"</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowInvoice(true)}>
              <Receipt size={16} className="mr-2" />
              Hóa đơn
            </Button>
            {onRebook && (
              <Button variant="default" className="flex-1" onClick={onRebook}>
                <RotateCcw size={16} className="mr-2" />
                Đặt lại
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {/* Invoice Header */}
          <div className="bg-gradient-hero p-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-sm font-bold">O</span>
                </div>
                <span className="text-lg font-bold">Otto</span>
              </div>
              <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
                <FileText size={12} className="mr-1" />
                Hóa đơn
              </Badge>
            </div>
            <p className="text-sm opacity-80">Số hóa đơn</p>
            <p className="text-lg font-mono font-bold">{invoiceNumber}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Order Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Thông tin đơn hàng</h4>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                    <p className="text-sm font-medium text-foreground font-mono">{order._id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ngày & giờ thực hiện</p>
                    <p className="text-sm font-medium text-foreground">{order.date} • {order.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Địa chỉ</p>
                    <p className="text-sm font-medium text-foreground">{order.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tasker thực hiện</p>
                    <p className="text-sm font-medium text-foreground">{tasker?.name || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Chi tiết thanh toán</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí dịch vụ — {order.service}</span>
                  <span className="text-foreground">{formatCurrency(serviceFee)}</span>
                </div>
                {/* <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí nền tảng</span>
                  <span className="text-foreground">{formatCurrency(platformFee)}</span>
                </div> */}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-foreground">Tổng cộng</span>
                    <span className="text-primary text-lg">{formatCurrency(order.price)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <CreditCard size={16} className="text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Phương thức thanh toán</p>
                <p className="text-sm font-medium text-foreground">Ví Otto</p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">Đã thanh toán</Badge>
            </div>

            {/* Footer info */}
            <div className="text-center text-xs text-muted-foreground border-t border-border pt-4 space-y-1">
              <p>Công ty TNHH Otto Việt Nam</p>
              <p>MST: 0123456789 • 123 Nguyễn Huệ, Q1, TP.HCM</p>
              <p>Hotline: 1900 1234 • support@otto.vn</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer size={16} className="mr-2" />
                In hóa đơn
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={() => {
                  // Simulate download
                  const link = document.createElement("a");
                  link.href = "#";
                  link.download = `${invoiceNumber}.pdf`;
                  link.click();
                }}
              >
                <Download size={16} className="mr-2" />
                Tải PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompletedView;
