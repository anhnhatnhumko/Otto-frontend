"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Service } from "@/app/admin/dashboard/types";

interface Province {
  _id: string;
  name: string;
}

interface Ward {
  _id: string;
  name: string;
}

interface AddTaskerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  onTaskerAdded?: () => void | Promise<void>;
  prefillData?: AddTaskerPrefillData | null;
}

type CreatedTaskerCredentials = {
  name: string;
  email: string;
  phone: string;
  tempPassword: string;
};

interface TaskerFormData {
  name: string;
  email: string;
  phone: string;
  provinceId: string;
  wardId: string;
  services: string[];
}

export interface AddTaskerPrefillData {
  name?: string;
  email?: string;
  phone?: string;
  provinceId?: string;
  wardId?: string;
  services?: string[];
}

type TaskerFormErrors = Partial<Record<keyof TaskerFormData, string>>;

type ApiErrorPayload = {
  message?: string | string[];
  fieldErrors?: TaskerFormErrors;
};

type TaskerCreateResponse = {
  tasker?: {
    name?: string;
    email?: string;
    phone?: string;
    tempPassword?: string;
    credentialsEmailSent?: boolean;
    emailSent?: boolean;
  };
  credentialsEmailSent?: boolean;
  emailSent?: boolean;
  credentialsEmailMessage?: string;
  emailMessage?: string;
  message?: string;
};

const INITIAL_FORM_STATE: TaskerFormData = {
  name: "",
  email: "",
  phone: "",
  provinceId: "",
  wardId: "",
  services: [],
};

class TaskerSubmitError extends Error {
  fieldErrors: TaskerFormErrors;

  constructor(message: string, fieldErrors: TaskerFormErrors = {}) {
    super(message);
    this.name = "TaskerSubmitError";
    this.fieldErrors = fieldErrors;
  }
}

const getResponseErrorPayload = async (
  response: Response,
): Promise<{ message: string; fieldErrors: TaskerFormErrors }> => {
  const fallbackMessage = `Lỗi ${response.status}: Không thể thêm tasker`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const errorData = (await response.json()) as ApiErrorPayload;

    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message?.trim() || fallbackMessage;

    return {
      message,
      fieldErrors: errorData.fieldErrors ?? {},
    };
  }

  const errorText = (await response.text()).trim();

  return {
    message: errorText || fallbackMessage,
    fieldErrors: {},
  };
};

const getToastTitle = (fieldErrors: TaskerFormErrors) => {
  if (fieldErrors.email && fieldErrors.phone) {
    return "Email và số điện thoại bị trùng";
  }

  if (fieldErrors.email) {
    return "Email bị trùng";
  }

  if (fieldErrors.phone) {
    return "Số điện thoại bị trùng";
  }

  if (fieldErrors.services) {
    return "Dịch vụ không hợp lệ";
  }

  return "Lỗi";
};

const resolveCredentialsEmailResult = (payload: TaskerCreateResponse) => {
  const sent =
    typeof payload.credentialsEmailSent === "boolean"
      ? payload.credentialsEmailSent
      : typeof payload.emailSent === "boolean"
        ? payload.emailSent
        : typeof payload.tasker?.credentialsEmailSent === "boolean"
          ? payload.tasker.credentialsEmailSent
          : typeof payload.tasker?.emailSent === "boolean"
            ? payload.tasker.emailSent
            : null;

  const message =
    payload.credentialsEmailMessage?.trim() ||
    payload.emailMessage?.trim() ||
    payload.message?.trim() ||
    "";

  return { sent, message };
};

export function AddTaskerFormDialog({
  open,
  onOpenChange,
  services,
  onTaskerAdded,
  prefillData,
}: AddTaskerFormDialogProps) {
  const [form, setForm] = useState<TaskerFormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<TaskerFormErrors>({});
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [createdCredentials, setCreatedCredentials] =
    useState<CreatedTaskerCredentials | null>(null);
  const [credentialsEmailSent, setCredentialsEmailSent] = useState<boolean | null>(null);
  const [credentialsEmailMessage, setCredentialsEmailMessage] = useState("");

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`/api/locations/provinces`);
        const data = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error("Load provinces failed", err);
      }
    };

    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!form.provinceId) {
      setWards([]);
      setForm((prev) => ({ ...prev, wardId: "" }));
      return;
    }

    const fetchWards = async () => {
      try {
        setLoadingWards(true);
        const res = await fetch(`/api/locations?provinceId=${form.provinceId}`);
        const data = await res.json();
        setWards(data);
        setForm((prev) => {
          const hasSelectedWard = data.some((ward: Ward) => ward._id === prev.wardId);
          return hasSelectedWard ? prev : { ...prev, wardId: "" };
        });
      } catch (err) {
        console.error("Load wards failed", err);
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [form.provinceId]);

  useEffect(() => {
    if (!open || !prefillData || createdCredentials) {
      return;
    }

    setForm({
      name: prefillData.name?.trim() ?? "",
      email: prefillData.email?.trim() ?? "",
      phone: prefillData.phone?.trim() ?? "",
      provinceId: prefillData.provinceId ?? "",
      wardId: prefillData.wardId ?? "",
      services: prefillData.services ?? [],
    });
    setErrors({});
    setAvatarFile(null);
    setCredentialsEmailSent(null);
    setCredentialsEmailMessage("");
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, [createdCredentials, open, prefillData]);

  const validateForm = (): boolean => {
    const nextErrors: TaskerFormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Vui lòng nhập họ tên";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9,10}$/.test(form.phone)) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (form.services.length === 0) {
      nextErrors.services = "Vui lòng chọn ít nhất 1 dịch vụ";
    }

    if (!form.provinceId) {
      nextErrors.provinceId = "Vui lòng chọn tỉnh";
    }

    if (!form.wardId) {
      nextErrors.wardId = "Vui lòng chọn phường/xã";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let response: Response;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("name", form.name.trim());
        formData.append("email", form.email.trim());
        formData.append("phone", form.phone.trim());
        formData.append("provinceId", form.provinceId);
        formData.append("wardId", form.wardId);
        formData.append("sendCredentialsEmail", "true");
        form.services.forEach((s) => formData.append("services[]", s));
        formData.append("avatar", avatarFile);

        response = await fetch(`/api/admin/taskers`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } else {
        response = await fetch(`/api/admin/taskers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            provinceId: form.provinceId,
            wardId: form.wardId,
            sendCredentialsEmail: true,
            services: form.services,
          }),
        });
      }

      if (!response.ok) {
        const errorPayload = await getResponseErrorPayload(response);
        throw new TaskerSubmitError(
          errorPayload.message,
          errorPayload.fieldErrors,
        );
      }

      const payload = (await response.json()) as TaskerCreateResponse;

      const tempPassword = payload?.tasker?.tempPassword;

      if (!tempPassword) {
        throw new Error("Tạo tasker thành công nhưng không nhận được mật khẩu tạm.");
      }

      setCreatedCredentials({
        name: payload.tasker?.name || form.name.trim(),
        email: payload.tasker?.email || form.email.trim(),
        phone: payload.tasker?.phone || form.phone.trim(),
        tempPassword,
      });

      const emailResult = resolveCredentialsEmailResult(payload);
      setCredentialsEmailSent(emailResult.sent);
      setCredentialsEmailMessage(emailResult.message);

      await onTaskerAdded?.();

      toast({
        title: "Thành công",
        description:
          emailResult.sent === true
            ? `Tasker ${form.name} đã được thêm và thông tin đăng nhập đã được gửi qua email.`
            : emailResult.sent === false
              ? `Tasker ${form.name} đã được thêm nhưng gửi email tự động chưa thành công. Bạn vẫn có thể sao chép mật khẩu tạm ở bước dưới.`
              : `Tasker ${form.name} đã được thêm. Hãy kiểm tra hộp thư tasker hoặc sao chép mật khẩu tạm nếu cần.`,
      });

      return;
    } catch (error) {
      console.error("Error adding tasker:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể thêm tasker. Vui lòng thử lại.";
      const fieldErrors =
        error instanceof TaskerSubmitError ? error.fieldErrors : {};

      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      toast({
        variant: "destructive",
        title: getToastTitle(fieldErrors),
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((currentId) => currentId !== serviceId)
        : [...prev.services, serviceId],
    }));

    if (errors.services) {
      setErrors((prev) => ({ ...prev, services: undefined }));
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM_STATE);
    setErrors({});
    setCreatedCredentials(null);
    setCredentialsEmailSent(null);
    setCredentialsEmailMessage("");
    setAvatarFile(null);
    setAvatarPreview(null);
    onOpenChange(false);
  };

  const handleCopyTempPassword = async () => {
    if (!createdCredentials?.tempPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdCredentials.tempPassword);
      toast({
        title: "Đã sao chép",
        description: "Mật khẩu tạm đã được sao chép vào clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Không thể sao chép",
        description: "Vui lòng sao chép thủ công mật khẩu tạm.",
      });
    }
  };

  const activeServices = services.filter((service) => service.status === "active");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm Tasker mới</DialogTitle>
          <DialogDescription>
            Điền thông tin để tạo tài khoản Tasker mới trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Tài khoản tasker đã được tạo thành công. Gửi thông tin đăng nhập này cho tasker:
              </p>
              {credentialsEmailSent === true ? (
                <p className="mt-2 text-xs text-emerald-600">
                  Hệ thống đã gửi thông tin đăng nhập qua email cho tasker.
                </p>
              ) : credentialsEmailSent === false ? (
                <p className="mt-2 text-xs text-amber-600">
                  Hệ thống chưa gửi được email tự động. Bạn vẫn có thể dùng mật khẩu tạm bên dưới.
                </p>
              ) : null}
              {credentialsEmailMessage ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {credentialsEmailMessage}
                </p>
              ) : null}
              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Họ tên:</span> {createdCredentials.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {createdCredentials.email}
                </p>
                <p>
                  <span className="font-medium">Số điện thoại:</span> {createdCredentials.phone}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mật khẩu tạm</Label>
              <div className="flex gap-2">
                <Input value={createdCredentials.tempPassword} readOnly />
                <Button type="button" variant="secondary" onClick={handleCopyTempPassword}>
                  Sao chép
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Khuyến nghị yêu cầu tasker đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tasker-name">
              Họ tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tasker-name"
              value={form.name}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, name: event.target.value }));
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              placeholder="VD: Nguyễn Văn A"
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tasker-email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tasker-email"
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, email: event.target.value }));
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="email@example.com"
                disabled={loading}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tasker-phone">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tasker-phone"
                value={form.phone}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, phone: event.target.value }));
                  if (errors.phone) {
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                  }
                }}
                placeholder="0901234567"
                disabled={loading}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tasker-avatar">Ảnh đại diện (tùy chọn)</Label>
            <div className="flex items-center gap-3">
              <input
                id="tasker-avatar"
                type="file"
                accept="image/*"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setAvatarFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setAvatarPreview(url);
                  } else {
                    setAvatarPreview(null);
                  }
                }}
              />

              {avatarPreview && (
                <div className="flex items-center gap-2">
                  <img src={avatarPreview} alt="preview" className="h-12 w-12 rounded-md object-cover border" />
                  <button
                    type="button"
                    className="text-sm text-red-600 underline"
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tasker-province">
                Tỉnh <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.provinceId}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, provinceId: value }));
                  if (errors.provinceId) {
                    setErrors((prev) => ({ ...prev, provinceId: undefined }));
                  }
                }}
                disabled={loading}
              >
                <SelectTrigger id="tasker-province">
                  <SelectValue placeholder="Chọn tỉnh" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province._id} value={province._id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.provinceId && (
                <p className="text-sm text-red-500">{errors.provinceId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tasker-ward">
                Phường/Xã <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.wardId}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, wardId: value }));
                  if (errors.wardId) {
                    setErrors((prev) => ({ ...prev, wardId: undefined }));
                  }
                }}
                disabled={loading || loadingWards || !form.provinceId}
              >
                <SelectTrigger id="tasker-ward">
                  <SelectValue
                    placeholder={loadingWards ? "Đang tải..." : "Chọn phường/xã"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward._id} value={ward._id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.wardId && <p className="text-sm text-red-500">{errors.wardId}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Dịch vụ đăng ký <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-3">
              {activeServices.length === 0 ? (
                <p className="w-full text-sm text-muted-foreground">
                  Không có dịch vụ nào để đăng ký.
                </p>
              ) : (
                activeServices.map((service) => {
                  const isSelected = form.services.includes(service.id);

                  return (
                    <Badge
                      key={service.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => handleServiceToggle(service.id)}
                    >
                      {service.name}
                    </Badge>
                  );
                })
              )}
            </div>
            {errors.services && (
              <p className="text-sm text-red-500">{errors.services}</p>
            )}
          </div>
          </div>
        )}

        <DialogFooter>
          {createdCredentials ? (
            <Button onClick={handleClose}>Đóng</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Đang thêm..." : "Thêm Tasker"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
