import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Settings, DollarSign, Shield, Phone, Mail, MapPin, Clock, Save, Bell } from "lucide-react";

const AdminSettings = () => {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Otto - Dịch vụ gia đình",
    contactEmail: "support@otto.vn",
    contactPhone: "1900 1234",
    address: "123 Nguyễn Huệ, Q1, TP.HCM",
    workingHours: "06:00 - 22:00",
    description: "Nền tảng kết nối dịch vụ gia đình hàng đầu Việt Nam",
  });

  const [feeSettings, setFeeSettings] = useState({
    platformFee: "15",
    minOrderAmount: "100000",
    cancellationFeePercent: "10",
    cancellationTimeLimit: "2",
    autoConfirmTimeout: "30",
  });

  const [policySettings, setPolicySettings] = useState({
    allowCancellation: true,
    requireDeposit: false,
    depositPercent: "30",
    autoAssignTasker: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  });

  const handleSaveGeneral = () => {
    toast({ title: "Thành công", description: "Đã lưu cài đặt chung" });
  };

  const handleSaveFees = () => {
    toast({ title: "Thành công", description: "Đã lưu cài đặt phí dịch vụ" });
  };

  const handleSavePolicy = () => {
    toast({ title: "Thành công", description: "Đã lưu cài đặt chính sách" });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Cài đặt chung</CardTitle>
          <CardDescription>Thông tin cơ bản về hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Settings className="h-3 w-3" />Tên hệ thống</Label>
              <Input value={generalSettings.siteName} onChange={e => setGeneralSettings(s => ({ ...s, siteName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="h-3 w-3" />Email liên hệ</Label>
              <Input type="email" value={generalSettings.contactEmail} onChange={e => setGeneralSettings(s => ({ ...s, contactEmail: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" />Số điện thoại</Label>
              <Input value={generalSettings.contactPhone} onChange={e => setGeneralSettings(s => ({ ...s, contactPhone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Clock className="h-3 w-3" />Giờ hoạt động</Label>
              <Input value={generalSettings.workingHours} onChange={e => setGeneralSettings(s => ({ ...s, workingHours: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" />Địa chỉ</Label>
              <Input value={generalSettings.address} onChange={e => setGeneralSettings(s => ({ ...s, address: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mô tả hệ thống</Label>
              <Textarea value={generalSettings.description} onChange={e => setGeneralSettings(s => ({ ...s, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} className="gap-2"><Save className="h-4 w-4" />Lưu cài đặt</Button>
          </div>
        </CardContent>
      </Card>

      {/* Fee Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Cài đặt phí dịch vụ</CardTitle>
          <CardDescription>Cấu hình phí nền tảng và chính sách hủy đơn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phí nền tảng (%)</Label>
              <Input type="number" value={feeSettings.platformFee} onChange={e => setFeeSettings(s => ({ ...s, platformFee: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Phần trăm hoa hồng trên mỗi đơn hàng</p>
            </div>
            <div className="space-y-2">
              <Label>Đơn hàng tối thiểu (VNĐ)</Label>
              <Input type="number" value={feeSettings.minOrderAmount} onChange={e => setFeeSettings(s => ({ ...s, minOrderAmount: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Giá trị đơn hàng tối thiểu</p>
            </div>
            <div className="space-y-2">
              <Label>Phí hủy đơn (%)</Label>
              <Input type="number" value={feeSettings.cancellationFeePercent} onChange={e => setFeeSettings(s => ({ ...s, cancellationFeePercent: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Phần trăm phí hủy trên giá trị đơn</p>
            </div>
            <div className="space-y-2">
              <Label>Thời hạn hủy miễn phí (giờ)</Label>
              <Input type="number" value={feeSettings.cancellationTimeLimit} onChange={e => setFeeSettings(s => ({ ...s, cancellationTimeLimit: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Hủy trong khoảng thời gian này sẽ không mất phí</p>
            </div>
            <div className="space-y-2">
              <Label>Timeout tự xác nhận (phút)</Label>
              <Input type="number" value={feeSettings.autoConfirmTimeout} onChange={e => setFeeSettings(s => ({ ...s, autoConfirmTimeout: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Thời gian chờ Tasker xác nhận trước khi tự động chuyển</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveFees} className="gap-2"><Save className="h-4 w-4" />Lưu cài đặt</Button>
          </div>
        </CardContent>
      </Card>

      {/* Policy & Notification Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Chính sách & Thông báo</CardTitle>
          <CardDescription>Cấu hình chính sách hoạt động và thông báo hệ thống</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cho phép hủy đơn</p>
                <p className="text-sm text-muted-foreground">Khách hàng có thể hủy đơn đã đặt</p>
              </div>
              <Switch checked={policySettings.allowCancellation} onCheckedChange={v => setPolicySettings(s => ({ ...s, allowCancellation: v }))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Yêu cầu đặt cọc</p>
                <p className="text-sm text-muted-foreground">Khách hàng phải đặt cọc khi đặt dịch vụ</p>
              </div>
              <Switch checked={policySettings.requireDeposit} onCheckedChange={v => setPolicySettings(s => ({ ...s, requireDeposit: v }))} />
            </div>
            {policySettings.requireDeposit && (
              <div className="ml-6 space-y-2">
                <Label>Phần trăm đặt cọc (%)</Label>
                <Input type="number" value={policySettings.depositPercent} onChange={e => setPolicySettings(s => ({ ...s, depositPercent: e.target.value }))} className="max-w-[200px]" />
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tự động phân công Tasker</p>
                <p className="text-sm text-muted-foreground">Hệ thống tự động tìm Tasker phù hợp</p>
              </div>
              <Switch checked={policySettings.autoAssignTasker} onCheckedChange={v => setPolicySettings(s => ({ ...s, autoAssignTasker: v }))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Thông báo Email</p>
                  <p className="text-sm text-muted-foreground">Gửi email thông báo cho người dùng</p>
                </div>
              </div>
              <Switch checked={policySettings.emailNotifications} onCheckedChange={v => setPolicySettings(s => ({ ...s, emailNotifications: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Thông báo SMS</p>
                  <p className="text-sm text-muted-foreground">Gửi SMS thông báo cho người dùng</p>
                </div>
              </div>
              <Switch checked={policySettings.smsNotifications} onCheckedChange={v => setPolicySettings(s => ({ ...s, smsNotifications: v }))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Chế độ bảo trì</p>
                <p className="text-sm text-muted-foreground">Tạm dừng hệ thống để bảo trì</p>
              </div>
              <Switch checked={policySettings.maintenanceMode} onCheckedChange={v => setPolicySettings(s => ({ ...s, maintenanceMode: v }))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSavePolicy} className="gap-2"><Save className="h-4 w-4" />Lưu cài đặt</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
