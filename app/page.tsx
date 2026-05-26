"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ServiceCard from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import {
  Home,
  Shirt,
  Wrench,
  Heart,
  Sparkles,
  Car,
  CheckCircle2,
  Star,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Brush,
  Bug,
} from "lucide-react";
import Link from "next/link";
import { requireApiUrl } from "@/lib/api-url";

const getIconKeyByName = (name: string): string => {
  const nameMap: Record<string, string> = {
    "Dọn dẹp nhà cửa": "home",
    "Giặt ủi": "shirt",
    "Sửa chữa điện, nước": "wrench",
    "Chăm sóc người cao tuổi": "heart",
    "Vệ sinh máy lạnh": "sparkles",
    "Rửa xe tại nhà": "car",
    "Sơn nhà": "brush",
    "Diệt côn trùng": "bug",
  };
  return nameMap[name] || "home";
};

const stats = [
  { number: "50K+", label: "Khách hàng tin tưởng" },
  { number: "10K+", label: "Đối tác chất lượng" },
  { number: "100K+", label: "Đơn hàng hoàn thành" },
  { number: "4.9", label: "Đánh giá trung bình" },
];

const steps = [
  {
    step: "01",
    title: "Chọn dịch vụ",
    description: "Chọn dịch vụ bạn cần từ danh sách đa dạng của chúng tôi",
  },
  {
    step: "02",
    title: "Đặt lịch",
    description: "Chọn thời gian và địa điểm phù hợp với bạn",
  },
  {
    step: "03",
    title: "Xác nhận",
    description: "Nhận thông báo xác nhận từ đối tác",
  },
  {
    step: "04",
    title: "Hoàn thành",
    description: "Đánh giá dịch vụ sau khi hoàn thành",
  },
];

const testimonials = [
  {
    name: "Nguyễn Thị Hương",
    avatar: "H",
    rating: 5,
    comment:
      "Dịch vụ rất tốt, nhân viên nhiệt tình và chuyên nghiệp. Tôi rất hài lòng!",
  },
  {
    name: "Trần Văn Minh",
    avatar: "M",
    rating: 5,
    comment:
      "Đặt dịch vụ dọn dẹp nhà rất nhanh chóng và tiện lợi. Sẽ tiếp tục sử dụng!",
  },
  {
    name: "Lê Thị Mai",
    avatar: "M",
    rating: 5,
    comment:
      "Giá cả hợp lý, chất lượng tuyệt vời. Otto là lựa chọn số 1 của gia đình tôi.",
  },
];

const Index = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`/api/services`, {
          credentials: "include",
        });
        const data = await res.json();
        
        const mapped = data.slice(0, 6).map((s: any) => ({
          id: s._id,
          icon: getIconKeyByName(s.name),
          title: s.name,
          description: s.description,
          price: `${s.pricePerHour.toLocaleString()}đ/giờ`,
          popular: data.indexOf(s) === 0,
        }));
        
        setServices(mapped);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-otto-cream -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />

        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-otto-primary-light text-primary text-sm font-medium">
                <Sparkles size={16} />
                <span>Nền tảng dịch vụ gia đình</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.2] ">
                Cuộc sống tiện lợi
                <span className="text-gradient block mt-3 pb-2">chỉ với một chạm</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Kết nối bạn với hàng nghìn chuyên gia đáng tin cậy cho mọi dịch
                vụ gia đình. Nhanh chóng, an toàn và chất lượng.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book-service" className="w-full sm:w-auto">
                  <Button asChild variant="hero" size="xl">
                    <span>
                      Đặt dịch vụ ngay
                      <ArrowRight className="ml-2" size={20} />
                    </span>
                  </Button>
                </Link>

                <Link href="#how-it-works">
                  <Button
                    variant="hero-outline"
                    size="xl"
                    className="w-full sm:w-auto"
                  >
                    Tìm hiểu thêm
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {["A", "B", "C", "D"].map((letter, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-sm font-medium border-2 border-background"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    50,000+ khách hàng hài lòng
                  </p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl animate-float">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=700&fit=crop"
                  alt="Dịch vụ gia đình Otto"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-lg z-20 animate-scale-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-otto-primary-light flex items-center justify-center">
                    <CheckCircle2 className="text-accent" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Đã xác minh</p>
                    <p className="text-sm text-muted-foreground">
                      100% đối tác
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient">
                  {stat.number}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Dịch vụ phổ biến
            </h2>
            <p className="text-muted-foreground">
              Khám phá các dịch vụ được yêu thích nhất tại Otto
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingServices ? (
              <p className="col-span-full text-center text-muted-foreground">Đang tải dịch vụ...</p>
            ) : services.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">Không có dịch vụ nào</p>
            ) : (
              services.map((service) => (
                <ServiceCard key={service.id} {...service} serviceId={service.id} />
              ))
            )}
          </div>

          <div className="text-center mt-10">
            <Link href="/book-service">
              <Button variant="hero-outline" size="lg">
                Xem tất cả dịch vụ
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-otto-cream">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Cách hoạt động
            </h2>
            <p className="text-muted-foreground">
              Chỉ 4 bước đơn giản để có được dịch vụ tốt nhất
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 text-center shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="text-4xl font-bold text-gradient mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Otto */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Tại sao chọn Otto?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: Shield,
                    title: "An toàn & Bảo mật",
                    description:
                      "100% đối tác được xác minh danh tính và có bảo hiểm",
                  },
                  {
                    icon: Clock,
                    title: "Nhanh chóng",
                    description:
                      "Đặt dịch vụ chỉ trong 60 giây, có mặt trong 2 giờ",
                  },
                  {
                    icon: Users,
                    title: "Đội ngũ chuyên nghiệp",
                    description: "Hơn 10,000 chuyên gia được đào tạo bài bản",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-otto-primary-light flex items-center justify-center shrink-0">
                      <item.icon className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1556741533-411cf82e4e2d?w=600&h=500&fit=crop"
                alt="Otto team"
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-otto-cream">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Khách hàng nói gì?
            </h2>
            <p className="text-muted-foreground">
              Hàng nghìn khách hàng tin tưởng và yêu thích Otto
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{item.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-medium">
                    {item.avatar}
                  </div>
                  <p className="font-medium text-foreground">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng trải nghiệm Otto?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Đăng ký ngay hôm nay và nhận ưu đãi giảm 20% cho đơn hàng đầu
              tiên!
            </p>
            <Link href="/register">
              <Button
                size="xl"
                className="bg-background text-primary hover:bg-background/90"
              >
                Đăng ký miễn phí
                <ArrowRight className="ml-2" size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Index;
