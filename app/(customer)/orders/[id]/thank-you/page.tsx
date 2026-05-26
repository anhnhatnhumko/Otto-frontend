"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Star,
  Home,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

type Order = {
  _id: string;
  serviceSnapshot?: { name?: string };
  rating?: number;
  review?: string;
};

const ThankYou = () => {
  const params = useParams();
  const orderId = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const existingRating = useMemo(() => order?.rating ?? 0, [order]);
  const hasRated = Boolean(existingRating);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Không thể tải đơn hàng");
        }

        const data = (await res.json()) as Order;
        setOrder(data);
        if (data.rating) {
          setRating(data.rating);
          setFeedback(data.review ?? "");
          setSubmitted(true);
        }
      } catch (err: any) {
        setError(err.message || "Đã có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const ratingLabel = useMemo(() => {
    if (rating <= 2) return "Chúng tôi sẽ cải thiện!";
    if (rating <= 4) return "Cảm ơn bạn!";
    if (rating > 0) return "Tuyệt vời! 🎉";
    return "";
  }, [rating]);

  const handleSubmitRating = async () => {
    if (!orderId || rating === 0) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/orders/${orderId}/rate`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          review: feedback,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || "Không thể gửi đánh giá");
      }

      const data = (await res.json()) as Order;
      setOrder(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-12 md:py-20">
        <div className="container max-w-lg mx-auto px-4">
          {/* Success Icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Cảm ơn bạn!
            </h1>
            <p className="text-muted-foreground text-lg">
              Dịch vụ{" "} 
              <span className="font-semibold text-foreground">
                {order?.serviceSnapshot?.name ?? ""}
              </span>{" "}
              của bạn đã hoàn thành.
            </p>
            <p className="text-muted-foreground mt-2">
              Chúng tôi rất vui vì được phục vụ bạn 💙
            </p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
            </Card>
          )}

          {/* Rating Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-6 text-muted-foreground">
                  Đang tải đánh giá...
                </div>
              ) : submitted ? (
                <div className="text-center py-4 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
                  <p className="font-semibold text-foreground">
                    {hasRated ? "Bạn đã đánh giá đơn hàng này" : "Đã gửi đánh giá!"}
                  </p>
                  <div className="flex justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  {feedback && (
                    <p className="text-sm text-muted-foreground">
                      "{feedback}"
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Cảm ơn bạn đã chia sẻ ý kiến.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground text-center">
                    Đánh giá trải nghiệm của bạn
                  </h2>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoveredStar || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && ratingLabel && (
                    <p className="text-center text-sm text-muted-foreground">
                      {ratingLabel}
                    </p>
                  )}
                  <textarea
                    placeholder="Chia sẻ thêm nhận xét của bạn (không bắt buộc)..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <Button
                    className="w-full"
                    onClick={handleSubmitRating}
                    disabled={rating === 0 || saving}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {saving ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/book-service" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Đặt dịch vụ khác
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/profile" className="block">
              <Button variant="ghost" className="w-full" size="lg">
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
