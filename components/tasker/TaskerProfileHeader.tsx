import { useUserStore } from "@/app/store/useUserStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Camera, Edit3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { handleAuthMeResponse } from "@/lib/auth-client";

interface TaskerProfileHeaderProps {
  isAvailable: boolean;
  onAvailableChange: (value: boolean) => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

type User = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
  skills?: string[];
};

type Service = {
  _id: string;
  id: string;
  name: string;
  status: string;
};

const TaskerProfileHeader = ({
  isAvailable,
  onAvailableChange,
  isEditing,
  onEditToggle,
}: TaskerProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string>(""); // 🔥 state avatar
  const { user: globalUser, setUser: setGlobalUser } = useUserStore();
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user) as User | null;
  const setUser = useUserStore((state) => state.setUser);
  const [services, setServices] = useState<Service[]>([]);
  const router = useRouter();

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "";

  useEffect(() => {
    fetch(`/api/auth/me`, {
      credentials: "include", // 👈 QUAN TRỌNG
    })
      .then((res) => handleAuthMeResponse(res, router))
      .then((data) => {
        setUser(data);
        setAvatar(data.avatar || "");
      })
      .catch(() => {
        setUser(null); // chưa login hoặc cookie hết hạn
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, []);

  // Tải danh sách dịch vụ để map ID → tên
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(
          `/api/services?includeInactive=true`
        );
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error("Lỗi tải danh sách dịch vụ:", err);
      }
    };

    fetchServices();
  }, []);

  // 👉 click icon camera
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  // 👉 chọn file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Chỉ cho phép ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File quá lớn (max 5MB)");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/avatar", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      // 🔥 update UI ngay
      setAvatar(data.avatar);
      if (globalUser) {
        setGlobalUser({
          ...globalUser,
          avatar: data.avatar,
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6 md:p-8 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative">
          {/* <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-3xl font-bold"> */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden bg-muted">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-3xl font-bold">
                {initial}
              </div>
            )}
          </div>
          <button
            onClick={handleClickUpload}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-muted transition-colors"
          >
            {loading ? (
              <span className="animate-spin text-xs">⏳</span>
            ) : (
              <Camera size={14} className="text-muted-foreground" />
            )}
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {user?.fullName || "Loading..."}
            </h1>
            <Badge className="bg-primary">Tasker Pro</Badge>
          </div>
          <p className="text-muted-foreground mb-3">
            Thành viên từ tháng 06/2023
          </p>
          <div className="flex flex-wrap gap-2">
            {user?.skills && user.skills.length > 0 ? (
              user.skills.map((skillId) => {
                const service = services.find(
                  (s) => s._id === skillId || s.id === skillId
                );
                const serviceIcon = {
                  "Dọn dẹp": "🧹",
                  "Sửa chữa": "🔧",
                  "Vệ sinh máy lạnh": "❄️",
                };
                const icon =
                  serviceIcon[service?.name as keyof typeof serviceIcon] || "⭐";

                return (
                  <span
                    key={skillId}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                  >
                    {icon} {service?.name || skillId}
                  </span>
                );
              })
            ) : (
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                Chưa có dịch vụ
              </span>
            )}
          </div>
        </div>

        {/* <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Sẵn sàng nhận việc
            </span>
            <Switch checked={isAvailable} onCheckedChange={onAvailableChange} />
          </div>
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            <Edit3 size={16} className="mr-2" />
            Chỉnh sửa
          </Button>
        </div> */}
      </div>
    </div>
  );
};

export default TaskerProfileHeader;
