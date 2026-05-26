"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";                        
import {  
  Users,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  Calendar,
  Briefcase,
  Star,
} from "lucide-react";
import { TaskerStatusBadge } from "../shared/StatusBadges";
import { formatCurrency } from "@/app/admin/dashboard/utils";
import type { Tasker } from "@/app/admin/dashboard/types";

type Province = {
  _id: string;
  name: string;
};

type Ward = {
  _id: string;
  name: string;
};

interface TaskerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasker: Tasker | null;
}

export function TaskerDetailDialog({ open, onOpenChange, tasker }: TaskerDetailDialogProps) {
  const [provinceName, setProvinceName] = useState("");
  const [wardName, setWardName] = useState("");

  useEffect(() => {
    if (!open || !tasker) return;

    let isMounted = true;

    const fetchLocationNames = async () => {
      try {
        if (tasker.provinceId && tasker.provinceId !== "all") {
          const provinceRes = await fetch(`/api/locations/provinces`, {
            cache: "no-store",
          });

          if (provinceRes.ok) {
            const provinces: Province[] = await provinceRes.json();
            const foundProvince = provinces.find((p) => p._id === tasker.provinceId);

            if (isMounted) {
              setProvinceName(foundProvince?.name ?? "");
            }
          }
        } else if (isMounted) {
          setProvinceName("");
        }

        if (
          tasker.provinceId &&
          tasker.provinceId !== "all" &&
          tasker.wardId &&
          tasker.wardId !== "all"
        ) {
          const wardRes = await fetch(
            `/api/locations?provinceId=${tasker.provinceId}`,
            { cache: "no-store" },
          );

          if (wardRes.ok) {
            const wards: Ward[] = await wardRes.json();
            const foundWard = wards.find((w) => w._id === tasker.wardId);

            if (isMounted) {
              setWardName(foundWard?.name ?? "");
            }
          }
        } else if (isMounted) {
          setWardName("");
        }
      } catch {
        if (isMounted) {
          setProvinceName("");
          setWardName("");
        }
      }
    };

    void fetchLocationNames();

    return () => {
      isMounted = false;
    };
  }, [open, tasker]);

  const displayAddress = useMemo(() => {
    if (wardName || provinceName) {
      return [wardName, provinceName].filter(Boolean).join(", ");
    }

    return tasker?.address ?? "";
  }, [provinceName, tasker?.address, wardName]);

  if (!tasker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Thông tin chi tiết về  {tasker.name}
            {tasker.verified && <FileCheck className="h-4 w-4 text-green-500" />}
          </DialogTitle>
          <DialogDescription>Thông tin chi tiết về người cung cấp dịch vụ</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trạng thái:</span>
            <TaskerStatusBadge status={tasker.status} />
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={Users} label="Họ tên" value={tasker.name} />
            <InfoItem icon={Phone} label="Điện thoại" value={tasker.phone} />
            <InfoItem icon={Mail} label="Email" value={tasker.email} className="col-span-2" />
            {/* <InfoItem icon={MapPin} label="Phường/Xã" value={wardName} /> */}
            {/* <InfoItem icon={MapPin} label="Tỉnh/Thành" value={provinceName} /> */}
            <InfoItem icon={MapPin} label="Địa chỉ" value={displayAddress} className="col-span-2" />
            {/* <InfoItem icon={FileCheck} label="CMND/CCCD" value={tasker.idCard} /> */}
            <InfoItem icon={Calendar} label="Ngày tham gia" value={tasker.joinDate} />
          </div>

          {/* Services */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Dịch vụ đăng ký
            </p>
            <div className="flex flex-wrap gap-2">
              {tasker.services.map((service, idx) => (
                <Badge key={idx} variant="secondary">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <StatItem
              icon={<Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
              value={tasker.rating > 0 ? tasker.rating.toFixed(1) : "—"}
              label="Đánh giá"
            />
            <StatItem value={String(tasker.completedJobs)} label="Hoàn thành" />
            <StatItem
              value={formatCurrency(tasker.earnings)}
              label="Thu nhập"
              className="text-primary"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}

function InfoItem({ icon: Icon, label, value, className }: InfoItemProps) {
  const displayValue = value && value.trim() ? value : "—";
  
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-sm text-muted-foreground flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="font-medium">{displayValue}</p>
    </div>
  );
}

interface StatItemProps {
  icon?: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}

function StatItem({ icon, value, label, className }: StatItemProps) {
  return (
    <div className="text-center">
      <div className={`flex items-center justify-center gap-1 text-lg font-semibold ${className ?? ""}`}>
        {icon}
        {value}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
