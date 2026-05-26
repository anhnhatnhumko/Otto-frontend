"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { requireApiUrl } from "@/lib/api-url";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Upload,
  CheckCircle2,
  Briefcase,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";

const staticServices = [
  { id: "cleaning", name: "Dọn dẹp nhà cửa", icon: "🧹" },
  { id: "repair", name: "Sửa chữa điện nước", icon: "🔧" },
  { id: "laundry", name: "Giặt ủi", icon: "👕" },
  { id: "ac", name: "Vệ sinh máy lạnh", icon: "❄️" },
  { id: "cooking", name: "Nấu ăn", icon: "🍳" },
  { id: "moving", name: "Chuyển nhà", icon: "📦" },
  { id: "gardening", name: "Chăm sóc cây cảnh", icon: "🌱" },
  { id: "elderly", name: "Chăm sóc người già", icon: "👴" },
];

const TaskerRegister = () => {
  const router = useRouter();
  const [services, setServices] = useState(staticServices);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    idCard: "",
    address: "",
    district: "",
    city: "",
    experience: "",
    introduction: "",
  });
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [isCheckingContact, setIsCheckingContact] = useState(false);
  const [contactErrors, setContactErrors] = useState({
    email: "",
    phone: "",
  });

  // Load real services from API (fall back to static list)
  useEffect(() => {
    const load = async () => {
      try {
        const API_URL = requireApiUrl();
        const res = await fetch(`/api/services`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const mapped = data.map((s: any) => ({ id: s._id, name: s.name, icon: s.icon || "🔧" }));
        if (mapped && mapped.length > 0) setServices(mapped);
      } catch (err) {
        console.error("Lỗi khi tải danh sách dịch vụ:", err);
      }
    };
    load();
  }, []);

  // Load provinces for district select
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const API_URL = requireApiUrl();
        const res = await fetch(`/api/locations/provinces`);
        if (!res.ok) return;
        const data = await res.json();
        setProvinces(data || []);
      } catch (err) {
        console.error('Lỗi tải tỉnh/thành:', err);
      }
    };
    void loadProvinces();
  }, []);

  // When user selects province, load wards
  const handleProvinceChange = async (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setSelectedDistrictId("");
    setWards([]);
    setFormData((p) => ({ ...p, district: '', city: '' }));
    try {
      const API_URL = requireApiUrl();
      const res = await fetch(`/api/locations?provinceId=${provinceId}`);
      if (!res.ok) return;
      const data = await res.json();
      setWards(data || []);
      const found = provinces.find((p) => p._id === provinceId);
      setFormData((prev) => ({ ...prev, city: found?.name || '' }));
    } catch (err) {
      console.error('Lỗi tải quận/huyện', err);
    }
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    const found = wards.find((w) => w._id === districtId);
    setFormData((prev) => ({ ...prev, district: found?.name || '' }));
  };

  const checkContactRegistered = async (input?: { email?: string; phone?: string }) => {
    const result = await getContactCheckResult(input);
    if (!result) return false;

    const { emailExists, phoneExists } = result;
    if (emailExists || phoneExists) {
      const messages: string[] = [];
      if (emailExists) messages.push('Email đã được đăng ký');
      if (phoneExists) messages.push('Số điện thoại đã được đăng ký');

      toast({
        variant: 'destructive',
        title: 'Thông tin đã tồn tại',
        description: `${messages.join(' và ')}. Vui lòng dùng thông tin khác.`,
      });
      return true;
    }

    return false;
  };

  const getContactCheckResult = async (input?: { email?: string; phone?: string }) => {
    const email = String(input?.email ?? formData.email ?? '').trim();
    const phone = String(input?.phone ?? formData.phone ?? '').trim().replace(/\s+/g, '');

    if (!email && !phone) return null;

    setIsCheckingContact(true);
    try {
      const API_URL = requireApiUrl();
      const query = new URLSearchParams();
      if (email) query.set('email', email);
      if (phone) query.set('phone', phone);

      const res = await fetch(`/api/admin/taskers/requests/check-contact?${query.toString()}`);
      if (!res.ok) return null;

      const json = await res.json();
      const data = json?.data ?? {};
      const emailExists = Boolean(data.emailExists);
      const phoneExists = Boolean(data.phoneExists);

      return { emailExists, phoneExists };
    } catch (err) {
      console.error('Lỗi kiểm tra email/số điện thoại:', err);
      return null;
    } finally {
      setIsCheckingContact(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email" || name === "phone") {
      setContactErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const applyContactErrors = (result: { emailExists: boolean; phoneExists: boolean } | null, input?: { email?: string; phone?: string }) => {
    const email = String(input?.email ?? formData.email ?? "").trim();
    const phone = String(input?.phone ?? formData.phone ?? "").trim().replace(/\s+/g, "");

    if (!result) return false;

    const nextErrors = {
      email: result.emailExists && email ? "Email đã được đăng ký" : "",
      phone: result.phoneExists && phone ? "Số điện thoại đã được đăng ký" : "",
    };

    setContactErrors(nextErrors);
    return result.emailExists || result.phoneExists;
  };

  const validateContactAndShowInlineErrors = async (input?: { email?: string; phone?: string }) => {
    const result = await getContactCheckResult(input);
    if (!result) return false;
    return applyContactErrors(result, input);
  };

  const handleSubmit = async () => {
    try {
      const contactStatus = await getContactCheckResult();
      if (contactStatus?.emailExists || contactStatus?.phoneExists) {
        applyContactErrors(contactStatus);
        const errorParam = contactStatus.emailExists
          ? 'email_exists'
          : contactStatus.phoneExists
            ? 'phone_exists'
            : 'duplicate_contact';

        router.push(`/tasker-register/success?status=error&error=${errorParam}`);
        return;
      }

      const API_URL = requireApiUrl();
      const payload = {
        formData: {
          ...formData,
          phone: String(formData.phone || '').trim().replace(/\s+/g, ''),
        },
        services: selectedServices,
      };

      const res = await fetch(`/api/admin/taskers/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Không thể gửi đăng ký');

      // Redirect to success page with user info
      const params = new URLSearchParams({
        status: 'success',
        name: formData.fullName || '',
        email: formData.email || '',
        phone: formData.phone || '',
      });

      router.push(`/tasker-register/success?${params.toString()}`);
    } catch (err) {
      toast({ 
        variant: 'destructive', 
        title: 'Lỗi', 
        description: String(err) 
      });
      router.push(`/tasker-register/success?status=error&error=submission_failed`);
    }
  };

  const nextStep = () => {
    (async () => {
      if (step === 1) {
        // validate required personal info
        const missing: string[] = [];
        if (!formData.fullName?.trim()) missing.push('Họ tên');
        if (!formData.phone?.trim()) missing.push('Số điện thoại');
        if (!formData.email?.trim()) missing.push('Email');
        if (!selectedProvinceId) missing.push('Tỉnh/Thành');
        if (!selectedDistrictId) missing.push('Quận/Huyện');

        if (missing.length > 0) {
          toast({
            variant: 'destructive',
            title: 'Vui lòng điền đầy đủ',
            description: `Thiếu: ${missing.join(', ')}`,
          });
          return;
        }

        if (isCheckingContact) {
          toast({ title: 'Vui lòng đợi', description: 'Đang kiểm tra trùng email/số điện thoại' });
          return;
        }

        const dup = await validateContactAndShowInlineErrors();
        if (dup) return;
      }

      if (step === 2) {
        if (selectedServices.length === 0) {
          toast({ variant: 'destructive', title: 'Vui lòng chọn dịch vụ', description: 'Bạn cần chọn ít nhất 1 dịch vụ' });
          return;
        }
      }

      if (step < 3) setStep(step + 1);
    })();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          {/* <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Về trang chủ</span>
          </Link> */}
          <Link href="/" className="flex items-center ">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
              <span className="text-xl font-bold text-primary-foreground">O</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Otto</span>
          </Link>
          <div className="w-24" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-hero py-12 md:py-16">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Trở thành Tasker của Otto
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Làm việc linh hoạt, thu nhập hấp dẫn và được hỗ trợ chuyên nghiệp
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 border-b border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Linh hoạt</p>
                <p className="text-sm text-muted-foreground">Tự chọn lịch làm</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Thu nhập cao</p>
                <p className="text-sm text-muted-foreground">Từ 8-15tr/tháng</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Đào tạo miễn phí</p>
                <p className="text-sm text-muted-foreground">Nâng cao kỹ năng</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-card rounded-xl">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="text-primary" size={24} />
              </div>
              <div>
                <p className="font-semibold text-foreground">Hỗ trợ 24/7</p>
                <p className="text-sm text-muted-foreground">Đội ngũ chuyên nghiệp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <main className="py-8 md:py-12">
        <div className="container max-w-3xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s ? <CheckCircle2 size={20} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-24 md:w-40 h-1 mx-2 rounded ${
                      step > s ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-8 text-sm">
            <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
              Thông tin cá nhân
            </span>
            <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
              Chọn dịch vụ
            </span>
            <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
              Xác nhận
            </span>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Thông tin cá nhân
                  </h2>
                  <p className="text-muted-foreground">
                    Vui lòng điền đầy đủ thông tin để chúng tôi xác minh
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Nguyễn Văn A"
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={() => {
                          if (formData.phone?.trim()) {
                            void validateContactAndShowInlineErrors({ phone: formData.phone });
                          }
                        }}
                        placeholder="0912 345 678"
                        className={`pl-10 h-12 ${contactErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                    {contactErrors.phone && (
                      <p className="text-sm text-destructive">{contactErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => {
                          if (formData.email?.trim()) {
                            void validateContactAndShowInlineErrors({ email: formData.email });
                          }
                        }}
                        placeholder="email@example.com"
                        className={`pl-10 h-12 ${contactErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                    </div>
                    {contactErrors.email && (
                      <p className="text-sm text-destructive">{contactErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* <Label htmlFor="idCard">Số CMND/CCCD *</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="idCard"
                        name="idCard"
                        value={formData.idCard}
                        onChange={handleInputChange}
                        placeholder="0123456789"
                        className="pl-10 h-12"
                      />
                    </div> */}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    {/* <Label htmlFor="address">Địa chỉ thường trú *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Số nhà, đường, phường/xã"
                        className="pl-10 h-12"
                      />
                    </div /> */}
                  </div> 

                  <div className="space-y-2">
                    <Label htmlFor="province">Tỉnh/Thành phố *</Label>
                    <Select
                      value={selectedProvinceId || ''}
                      onValueChange={(value) => handleProvinceChange(value)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Chọn tỉnh / thành" />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">Địa chỉ *</Label>
                    <Select
                      value={selectedDistrictId || ''}
                      onValueChange={(value) => handleDistrictChange(value)}
                      disabled={wards.length === 0}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Chọn quận / huyện" />
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

                {/* Upload Documents */}
                {/* <div className="space-y-4">
                  <Label>Tải lên giấy tờ xác minh</Label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="mx-auto text-muted-foreground mb-2" size={32} />
                      <p className="font-medium text-foreground">Ảnh CMND/CCCD mặt trước</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG tối đa 5MB</p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="mx-auto text-muted-foreground mb-2" size={32} />
                      <p className="font-medium text-foreground">Ảnh CMND/CCCD mặt sau</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG tối đa 5MB</p>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

            {/* Step 2: Select Services */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Chọn dịch vụ bạn muốn cung cấp
                  </h2>
                  <p className="text-muted-foreground">
                    Chọn ít nhất 1 dịch vụ bạn có kinh nghiệm
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceToggle(service.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedServices.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="text-3xl mb-2 block">{service.icon}</span>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      {selectedServices.includes(service.id) && (
                        <CheckCircle2 className="text-primary mx-auto mt-2" size={20} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Kinh nghiệm làm việc</Label>
                  <Textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="Mô tả kinh nghiệm của bạn trong các lĩnh vực đã chọn..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="introduction">Giới thiệu bản thân</Label>
                  <Textarea
                    id="introduction"
                    name="introduction"
                    value={formData.introduction}
                    onChange={handleInputChange}
                    placeholder="Viết vài dòng giới thiệu về bản thân để khách hàng hiểu bạn hơn..."
                    rows={4}
                  />
                </div>
              </div>
            )}


            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Xác nhận thông tin
                  </h2>
                  <p className="text-muted-foreground">
                    Vui lòng kiểm tra lại thông tin trước khi gửi đăng ký
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <User size={18} className="text-primary" />
                      Thông tin cá nhân
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Họ tên:</span>{" "}
                        <span className="text-foreground">{formData.fullName || "Chưa điền"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">SĐT:</span>{" "}
                        <span className="text-foreground">{formData.phone || "Chưa điền"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        <span className="text-foreground">{formData.email || "Chưa điền"}</span>
                      </div>
                      {/* <div>
                        <span className="text-muted-foreground">CMND/CCCD:</span>{" "}
                        <span className="text-foreground">{formData.idCard || "Chưa điền"}</span>
                      </div> */}
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Địa chỉ:</span>{" "}
                        <span className="text-foreground">
                          {formData.district && formData.city
                            ? `${formData.district}, ${formData.city}`
                            : "Chưa điền"}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Kinh nghiệm làm việc:</span>{" "}
                        <span className="text-foreground whitespace-pre-wrap">
                          {formData.experience?.trim() || "Chưa điền"}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">Giới thiệu bản thân:</span>{" "}
                        <span className="text-foreground whitespace-pre-wrap">
                          {formData.introduction?.trim() || "Chưa điền"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4">
                    <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Briefcase size={18} className="text-primary" />
                      Dịch vụ đăng ký
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.length > 0 ? (
                        selectedServices.map((id) => {
                          const service = services.find((s) => s.id === id);
                          return (
                            <span
                              key={id}
                              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                            >
                              {service?.icon} {service?.name}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground text-sm">Chưa chọn dịch vụ</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* <div className="flex items-start gap-3">
                  <input id="terms" type="checkbox" className="w-4 h-4 rounded" />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    Tôi đồng ý với{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Điều khoản dịch vụ
                    </Link>{" "}
                    và{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Chính sách bảo mật
                    </Link>{" "}
                    của Otto
                  </Label>
                </div> */}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="outline" onClick={prevStep}>
                  Quay lại
                </Button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <Button variant="hero" onClick={nextStep}>
                  Tiếp tục
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={isCheckingContact}>
                  Gửi đăng ký
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskerRegister;
