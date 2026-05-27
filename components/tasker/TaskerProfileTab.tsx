"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, Loader2, Mail, Phone, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";


interface TaskerProfileTabProps {
  isEditing: boolean;
  onEditToggle: () => void;
}

type User = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  provinceId?: string | { _id: string; name: string };
  wardId?: string | { _id: string; name: string };
  skills?: (string | { _id: string; id: string; name: string })[];
  address?: string;
  idCard?: string;
};

type Province = {
  _id: string;
  name: string;
};

type Ward = {
  _id: string;
  name: string;
};

type Service = {
  _id: string;
  id: string;
  name: string;
  status?: string;
  isActive?: boolean;
};

const TaskerProfileTab = ({
  isEditing,
  onEditToggle,
}: TaskerProfileTabProps) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [provinceName, setProvinceName] = useState("");
  const [wardName, setWardName] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedWardId, setSelectedWardId] = useState("");
  const [editSessionKey, setEditSessionKey] = useState(0);
  const previousProvinceRef = useRef("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    idCard: "",
  });

  // Helper: Extract ID từ province/ward (có thể là object hoặc string)
  const getId = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item._id || item.id || "";
  };

  const getName = (item: any): string => {
    if (!item) return "";
    if (typeof item === "string") return "";
    return item.name || "";
  };

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  // Tải thông tin user, tỉnh, dịch vụ
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Tải user hiện tại (qua proxy cùng domain để cookie httpOnly được gửi)
        const userRes = await fetch(`/api/auth/me`, {
          credentials: "include",
        });
        const userData = await userRes.json();
        console.log("📋 User data:", userData);
        setUser(userData);
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
          idCard: userData.idCard || "",
        });

        const provinceId = getId(userData.provinceId);
        // Tải danh sách tỉnh (dùng cho select)
        const provincesRes = await fetch(`/api/locations/provinces`);
        const provincesData = await provincesRes.json();
        setProvinces(provincesData);
        const wardId = getId(userData.wardId);
        setSelectedWardId(wardId);
        setWardName(
          typeof userData.wardId === "string"
            ? ""
            : userData.wardId?.name || "",
        );

        if (provinceId) {
          setSelectedProvince(provinceId);
          const foundProvince = provincesData.find((p: Province) => p._id === provinceId);
          setProvinceName(foundProvince?.name || getName(userData.provinceId));

          const wardRes = await fetch(`/api/locations?provinceId=${provinceId}`);
          const wardData = await wardRes.json();
          setWards(wardData);
        }

        // Extract skill IDs từ array (có thể là array of strings hoặc array of objects)
        const skillIds = (userData.skills || []).map((skill: any) => {
          return typeof skill === "string" ? skill : (skill._id || skill.id || "");
        });
        console.log("🎯 Skills từ user:", skillIds);
        setSelectedServices(skillIds);

        // Tải danh sách dịch vụ
        const serviceRes = await fetch(`/api/services?includeInactive=true`);
        const serviceData = await serviceRes.json();
        console.log("🔧 Services từ API:", serviceData);
        setServices(serviceData);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải thông tin hồ sơ",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Khi đổi tỉnh, load wards và reset selectedWardId
  useEffect(() => {
    const loadWards = async () => {
      if (!selectedProvince) {
        setWards([]);
        setSelectedWardId("");
        setProvinceName("");
        return;
      }

      try {
        const res = await fetch(`/api/locations?provinceId=${selectedProvince}`);
        const data = await res.json();
        setWards(data || []);
        const provinceChanged =
          previousProvinceRef.current !== "" &&
          previousProvinceRef.current !== selectedProvince;
        if (provinceChanged) {
          setSelectedWardId("");
        }
        previousProvinceRef.current = selectedProvince;
        const found = provinces.find((p) => p._id === selectedProvince);
        setProvinceName(found?.name || "");
      } catch (err) {
        console.error('Lỗi tải quận/huyện khi đổi tỉnh:', err);
      }
    };

    void loadWards();
  }, [selectedProvince, provinces]);

  useEffect(() => {
    const matchedWardName = wards.find((ward) => ward._id === selectedWardId)?.name || "";
    if (matchedWardName) {
      setWardName(matchedWardName);
    }
  }, [selectedWardId, wards]);

  useEffect(() => {
    if (!isEditing || !user) return;

    setEditSessionKey((value) => value + 1);

    const provinceId = getId(user.provinceId);
    const wardId = getId(user.wardId);

    if (provinceId) {
      setSelectedProvince(provinceId);
      previousProvinceRef.current = provinceId;
    }

    if (wardId) {
      setSelectedWardId(wardId);
      setWardName(typeof user.wardId === "string" ? wardName : user.wardId?.name || wardName);
    }

    if (provinceId) {
      const loadCurrentWards = async () => {
        try {
          const res = await fetch(`/api/locations?provinceId=${provinceId}`);
          const data = await res.json();
          setWards(data || []);
          if (wardId) {
            setSelectedWardId(wardId);
            setWardName(
              data?.find((ward: Ward) => ward._id === wardId)?.name ||
                (typeof user.wardId === "string" ? wardName : user.wardId?.name || wardName),
            );
          }
        } catch (err) {
          console.error('Lỗi tải xã/phường khi mở chỉnh sửa:', err);
        }
      };

      void loadCurrentWards();
    }
  }, [isEditing, user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage("");
      setFieldErrors({
        fullName: "",
        email: "",
        phone: "",
      });

      const nextFieldErrors = {
        fullName: formData.fullName.trim() ? "" : "Vui lòng nhập họ và tên",
        email: formData.email.trim() ? "" : "Vui lòng nhập email",
        phone: formData.phone.trim() ? "" : "Vui lòng nhập số điện thoại",
      };

      setFieldErrors(nextFieldErrors);

      if (Object.values(nextFieldErrors).some(Boolean)) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng kiểm tra các trường bị lỗi bên dưới.",
        });
        return;
      }

      if (!selectedWardId) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng chọn xã/phường.",
        });
        return;
      }

      if (selectedServices.length === 0) {
        toast({
          variant: "destructive",
          title: "Thiếu thông tin",
          description: "Vui lòng chọn ít nhất 1 dịch vụ.",
        });
        return;
      }

      const updatePayload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        idCard: formData.idCard,
        provinceId: selectedProvince,
        wardId: selectedWardId,
        skills: selectedServices,
      };

      console.log("🔥 Gửi payload:", updatePayload);

      const res = await fetch(`/api/tasker/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatePayload),
      });

      console.log("Response status:", res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Lỗi từ server:", errorData);

        throw new Error(errorData.message || "Không thể cập nhật hồ sơ");
      }

      const updatedUser = await res.json();
      console.log("✅ Cập nhật thành công:", updatedUser);
      setUser(updatedUser);
      setFormData({
        fullName: updatedUser.fullName || "",
        email: updatedUser.email || "",
        phone: updatedUser.phone || "",
        idCard: updatedUser.idCard || "",
      });
      setSelectedProvince(getId(updatedUser.provinceId));
      setSelectedWardId(getId(updatedUser.wardId));
      setWardName(
        typeof updatedUser.wardId === "string"
          ? wards.find((ward) => ward._id === getId(updatedUser.wardId))?.name || wardName
          : updatedUser.wardId?.name || wardName,
      );
      setSelectedServices(
        (updatedUser.skills || []).map((skill: any) =>
          typeof skill === "string" ? skill : (skill._id || skill.id || ""),
        ),
      );
      setFieldErrors({
        fullName: "",
        email: "",
        phone: "",
      });
      onEditToggle();
      setSuccessMessage("Hồ sơ đã được cập nhật thành công.");
    } catch (err) {
      console.error("Lỗi lưu hồ sơ:", err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: err instanceof Error ? err.message : "Không thể lưu hồ sơ",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentProvinceName = provinceName || getName(user?.provinceId);
  const currentWardName =
    wardName || wards.find((ward) => ward._id === selectedWardId)?.name || getName(user?.wardId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>
              Quản lý thông tin tài khoản của bạn
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? "hero" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : onEditToggle}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Edit3 size={16} className="mr-2" />
            )}
            {saving ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {successMessage ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 mb-6">
            {successMessage}
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="fullName"
                value={formData.fullName}
                disabled={true}
                className="pl-10 h-12 bg-muted/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={true}
                className="pl-10 h-12 bg-muted/50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                disabled={true}
                className="pl-10 h-12 bg-muted/50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* <div className="space-y-2">
            <Label>CMND/CCCD</Label>
            <Input
              value={formData.idCard}
              onChange={(e) => setFormData((prev) => ({ ...prev, idCard: e.target.value }))}
              disabled={!isEditing}
              className="h-12"
            />
          </div> */}

          <div className="pt-4 border-t border-border md:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Khu vực nhận đơn</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tỉnh/Thành phố</Label>
                {isEditing ? (
                  <Select key={`province-${editSessionKey}`} value={selectedProvince} onValueChange={(v) => setSelectedProvince(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Chọn tỉnh" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={currentProvinceName || ""} disabled className="h-12" />
                )}
              </div>

              <div className="space-y-2">
                <Label>Xã/Phường</Label>
                {isEditing ? (
                  <Select key={`ward-${editSessionKey}-${selectedProvince}`} value={selectedWardId} onValueChange={(v) => setSelectedWardId(v)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Chọn xã/phường" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={ward._id} value={ward._id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={currentWardName || ""} disabled className="h-12" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border md:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">
              Dịch vụ đăng ký ({selectedServices.length} dịch vụ)
            </h3>
            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {services && services.length > 0 ? (
                  services
                    .filter((s) => s.isActive !== false)
                    .map((service) => (
                      <Badge
                        key={service._id || service.id}
                        variant={selectedServices.includes(service._id || service.id) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-2"
                        onClick={() => toggleService(service._id || service.id)}
                      >
                        {service.name}
                      </Badge>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có dịch vụ nào để hiển thị
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services && services.length > 0 ? (
                  services
                    .filter((s) => selectedServices.includes(s._id || s.id) && s.isActive !== false)
                    .map((service) => (
                      <Badge key={service._id || service.id} variant="default">
                        {service.name}
                      </Badge>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Chưa đăng ký dịch vụ nào
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskerProfileTab;
