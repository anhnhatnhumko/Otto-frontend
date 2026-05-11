"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Home,
  Shirt,
  Wrench,
  Heart,
  Sparkles,
  Car,
  Brush,
  Bug,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  LucideIcon,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AddressSelector, { AddressData } from "@/components/AddressSelector";

interface Service {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  price: string;
  priceValue: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getIconByName = (name: string): LucideIcon => {
  switch (name) {
    case "Dọn dẹp nhà cửa":
      return Home;
    case "Giặt ủi":
      return Shirt;
    case "Sửa chữa điện, nước":
      return Wrench;
    case "Chăm sóc người cao tuổi":
      return Heart;
    case "Vệ sinh máy lạnh":
      return Sparkles;
    case "Rửa xe tại nhà":
      return Car;
    case "Sơn nhà":
      return Brush;
    case "Diệt côn trùng":
      return Bug;
    default:
      return Home;
  }
};

const paymentMethods = [
  {
    id: "wallet",
    label: "Ví OTTO",
    desc: "Thanh toán bằng số dư ví",
    icon: CreditCard,
  },
  {
    id: "stripe",
    label: "Thẻ ngân hàng",
    desc: "Thanh toán qua Stripe",
    icon: CreditCard,
  },
  {
    id: "cash",
    label: "Tiền mặt",
    desc: "Thanh toán sau khi hoàn thành",
    icon: CreditCard,
  },
];

const BookService = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [note, setNote] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const selectedTime = startTime && endTime ? `${startTime} - ${endTime}` : "";

  const getEndTimeOptions = () => {
    if (!startTime) return [];
    const startHour = parseInt(startTime.split(":")[0]);
    const minEnd = startHour + 2; // ít nhất 2 tiếng
    return availableHours.filter((h) => parseInt(h.split(":")[0]) >= minEnd);
  };

  const totalHours =
    startTime && endTime
      ? parseInt(endTime.split(":")[0]) - parseInt(startTime.split(":")[0])
      : 0;

  const totalPrice =
    selectedService && totalHours ? totalHours * selectedService.priceValue : 0;

  const [address, setAddress] = useState<AddressData>({
    provinceId: "",
    wardId: "",
    addressDetail: "",
    provinceName: "",
    wardName: "",
    address: "",
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`, {
          credentials: "include",
        });

        const data = await res.json();

        const mapped: Service[] = data.map((s: any) => ({
          id: s._id,
          icon: getIconByName(s.name),
          title: s.name,
          description: s.description,
          price: `${s.pricePerHour.toLocaleString()}đ`,
          priceValue: s.pricePerHour,
        }));

        setServices(mapped);
      } catch (err) {
        console.error("Load services failed", err);
      }
    };

    fetchServices();
  }, []);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const availableHours = Array.from({ length: 15 }, (_, i) => {
    const hour = 6 + i; // 6:00 - 20:00
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedService) return;

    try {
      const scheduleTime = new Date(`${selectedDate}T${startTime}:00`);

      const res = await fetch(`${API_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          provinceId: address.provinceId,
          wardId: address.wardId,
          address: address.address,
          scheduleTime: scheduleTime.toISOString(),
          startTime,
          endTime,
          note,
          paymentMethod: selectedMethod,
          serviceSnapshot: {
            name: selectedService.title,
            price: selectedService.priceValue,
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Booking failed");
      }

      const data = await res.json();
      console.log("ORDER CREATED:", data);

      if (!selectedMethod) {
        alert("Vui lòng chọn phương thức thanh toán");
        return;
      }

      if (selectedMethod === "cash") {
        router.push(`/orders/${data._id}`);
      } else {
        router.push(`/payment/${data._id}`);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-8 md:py-12">
        <div className="container max-w-4xl">
          {/* Progress Steps */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        s <= step
                          ? "bg-gradient-hero text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s < step ? <CheckCircle2 size={20} /> : s}
                    </div>
                    {s < 3 && (
                      <div
                        className={`w-16 md:w-24 h-1 ml-2 rounded ${
                          s < step ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-8 md:gap-20 text-sm">
                <span
                  className={
                    step >= 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  Chọn dịch vụ
                </span>
                <span
                  className={
                    step >= 2
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  Đặt lịch
                </span>
                <span
                  className={
                    step >= 3
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  Xác nhận
                </span>
              </div>
            </div>
          )}

          {/* Step 1: Choose Service */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
                Chọn dịch vụ bạn cần
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Chọn một dịch vụ để tiếp tục đặt lịch
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="bg-card rounded-2xl p-5 text-left shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-otto-primary-light flex items-center justify-center group-hover:scale-110 transition-transform">
                        <service.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {service.description}
                        </p>
                        <p className="text-primary font-semibold">
                          {service.price}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="animate-fade-up">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft size={18} />
                Quay lại
              </button>

              <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
                {/* Selected Service */}
                {selectedService && (
                  <div className="flex items-center gap-4 p-4 bg-otto-primary-light rounded-xl mb-6">
                    <selectedService.icon className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {selectedService.title}
                      </h3>
                      <p className="text-sm text-primary font-medium">
                        {selectedService.price}
                      </p>
                    </div>
                  </div>
                )}

                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Chọn ngày và giờ
                </h2>

                <div className="space-y-6">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar size={16} />
                      Chọn ngày
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-12"
                    />
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock size={16} />
                      Chọn giờ (ít nhất 2 tiếng)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">
                          Từ
                        </span>
                        <select
                          value={startTime}
                          onChange={(e) => {
                            setStartTime(e.target.value);
                            setEndTime("");
                          }}
                          className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="">-- Giờ bắt đầu --</option>
                          {availableHours.slice(0, -2).map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-muted-foreground">
                          Đến
                        </span>
                        <select
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={!startTime}
                          className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">-- Giờ kết thúc --</option>
                          {getEndTimeOptions().map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {startTime && endTime && (
                      <p className="text-sm text-primary font-medium">
                        Thời gian: {startTime} - {endTime} (Tổng {totalHours}{" "}
                        tiếng)
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <AddressSelector value={address} onChange={setAddress} />

                  {/* Note */}
                  <div className="space-y-2">
                    <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
                    <Textarea
                      id="note"
                      placeholder="Thêm ghi chú cho người cung cấp dịch vụ..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-8"
                  onClick={handleNext}
                  disabled={
                    !selectedDate ||
                    !selectedTime ||
                    !address.provinceId ||
                    !address.wardId ||
                    !address.address
                  }
                >
                  Tiếp tục
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="animate-fade-up">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft size={18} />
                Quay lại
              </button>

              <div className="bg-card rounded-2xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Xác nhận đặt dịch vụ
                </h2>

                <div className="space-y-4">
                  {/* Service */}
                  {selectedService && (
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                      <selectedService.icon className="w-8 h-8 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {selectedService.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedService.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-3 py-4 border-y border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar size={16} />
                        Ngày
                      </span>
                      <span className="font-medium text-foreground">
                        {selectedDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock size={16} />
                        Giờ
                      </span>
                      <span className="font-medium text-foreground">
                        {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <MapPin size={16} />
                        Địa chỉ
                      </span>
                      <span className="font-medium text-foreground text-right max-w-[200px]">
                        {address.address}
                      </span>
                    </div>
                    {note && (
                      <div className="pt-2">
                        <span className="text-muted-foreground text-sm">
                          Ghi chú:
                        </span>
                        <p className="text-foreground mt-1">{note}</p>
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex justify-between items-center py-4">
                    <span className="text-lg font-semibold text-foreground">
                      Tổng thanh toán
                    </span>
                    <span className="text-2xl font-bold text-gradient">
                      {totalPrice.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CreditCard size={18} className="text-primary" />
                    Phương thức thanh toán
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selectedMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedMethod === method.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <method.icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {method.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {method.desc}
                          </p>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle2
                            size={16}
                            className="text-primary ml-auto shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-4"
                onClick={handleSubmit}
              >
                Xác nhận đặt dịch vụ
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookService;
