"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { buildFullAddress } from "@/lib/utils/address";

interface Province {
  _id: string;
  name: string;
}

interface Ward {
  _id: string;
  name: string;
}

export interface AddressData {
  provinceId: string;
  wardId: string;
  addressDetail: string;
  provinceName: string;
  wardName: string;
  address: string;
}

interface AddressSelectorProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
}

const AddressSelector = ({ value, onChange }: AddressSelectorProps) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  // ============================
  // LOAD PROVINCES
  // ============================

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

  // ============================
  // LOAD WARDS BY PROVINCE
  // ============================

  useEffect(() => {
    if (!value.provinceId) {
      setWards([]);
      return;
    }

    const fetchWards = async () => {
      try {
        setLoadingWards(true);

        const res = await fetch(
          `/api/locations?provinceId=${value.provinceId}`
        );

        const data = await res.json();

        setWards(data);
      } catch (err) {
        console.error("Load wards failed", err);
      } finally {
        setLoadingWards(false);
      }
    };

    fetchWards();
  }, [value.provinceId]);

  // ============================
  // HANDLERS
  // ============================

  const handleProvinceChange = (provinceId: string) => {
    const provinceName = provinces.find((p) => p._id === provinceId)?.name || "";
    onChange({
      provinceId,
      wardId: "",
      addressDetail: value.addressDetail,
      provinceName,
      wardName: "",
      address: buildFullAddress({
        addressDetail: value.addressDetail,
        provinceName,
      }),
    });
  };

  const handleWardChange = (wardId: string) => {
    const wardName = wards.find((w) => w._id === wardId)?.name || "";
    onChange({
      ...value,
      wardId,
      wardName,
      address: buildFullAddress({
        addressDetail: value.addressDetail,
        wardName,
        provinceName: value.provinceName,
      }),
    });
  };

  const handleAddressChange = (addressDetail: string) => {
    onChange({
      ...value,
      addressDetail,
      address: buildFullAddress({
        addressDetail,
        wardName: value.wardName,
        provinceName: value.provinceName,
      }),
    });
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2 text-base">
        <MapPin size={16} />
        Địa chỉ
      </Label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Province */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            Tỉnh / Thành phố
          </Label>

          <Select value={value.provinceId} onValueChange={handleProvinceChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Chọn tỉnh / thành phố" />
            </SelectTrigger>

            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ward */}
        <div className="space-y-1.5">
          <Label className="text-sm text-muted-foreground">
            Phường / Xã
          </Label>

          <Select
            value={value.wardId}
            onValueChange={handleWardChange}
            disabled={!value.provinceId || loadingWards}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Chọn phường / xã" />
            </SelectTrigger>

            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w._id} value={w._id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Address Detail */}
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground">
          Số nhà / Tên đường
        </Label>

        <Input
          placeholder="Ví dụ: 123 Nguyễn Huệ"
          value={value.addressDetail}
          onChange={(e) => handleAddressChange(e.target.value)}
          className="h-12"
        />
      </div>

      {value.address && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-foreground">
          <span className="text-muted-foreground mr-2">Địa chỉ đầy đủ:</span>
          {value.address}
        </div>
      )}
    </div>
  );
};

export default AddressSelector;