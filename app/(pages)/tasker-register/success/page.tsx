"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export default function TaskerRegisterSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    // Get status from URL query params
    const statusParam = searchParams.get("status");
    const errorParam = searchParams.get("error");
    const nameParam = searchParams.get("name");
    const emailParam = searchParams.get("email");
    const phoneParam = searchParams.get("phone");

    if (statusParam === "error") {
      setStatus("error");
      if (errorParam === "email_exists") {
        setErrorMessage("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
      } else if (errorParam === "phone_exists") {
        setErrorMessage("Số điện thoại này đã được đăng ký. Vui lòng sử dụng số khác.");
      } else if (errorParam === "duplicate_contact") {
        setErrorMessage("Email hoặc số điện thoại này đã tồn tại trong hệ thống.");
      } else {
        setErrorMessage(errorParam || "Có lỗi xảy ra trong quá trình đăng ký.");
      }
    } else {
      setStatus("success");
      if (nameParam || emailParam || phoneParam) {  
        setFormData({
          fullName: nameParam,
          email: emailParam,
          phone: phoneParam,
        });
      }
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang xử lý...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center pb-3">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-700">Lỗi Đăng Ký</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4 border border-red-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Vui lòng kiểm tra thông tin và thử lại.
            </p>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => router.back()}
                className="w-full"
              >
                Quay Lại
              </Button>
              <Link href="/tasker-register" className="w-full">
                <Button variant="outline" className="w-full">
                  Điền Lại Form
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br  p-4">
      <Card className="w-full max-w-md bg-background shadow-lg">
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-blue-100 rounded-full animate-scale-up">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-blue-700 text-2xl">Đăng Ký Thành Công!</CardTitle>
          <CardDescription className="mt-2">
            Hồ sơ Tasker của bạn đã được gửi thành công
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {formData && (
            <div className="rounded-lg p-4 space-y-3 border bg-background">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Họ và Tên</p>
                <p className="text-sm font-semibold text-foreground">{formData.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Email</p>
                <p className="text-sm font-semibold text-foreground break-all">{formData.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase">Số Điện Thoại</p>
                <p className="text-sm font-semibold text-foreground">{formData.phone || "—"}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-2">
            <p className="text-sm font-semibold text-blue-900">Các bước tiếp theo:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Chúng tôi sẽ xem xét hồ sơ của bạn</li>
              <li>Bạn sẽ nhận được email xác nhận</li>
              <li>Tài khoản sẽ được kích hoạt trong 24-48 giờ</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Nếu có câu hỏi, vui lòng liên hệ với đội hỗ trợ của chúng tôi
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/" className="w-full">
              <Button className="w-full">
                Về Trang Chủ
              </Button>
            </Link>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full">
                Đăng Nhập
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
