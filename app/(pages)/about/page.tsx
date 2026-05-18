import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Clock,
  Users,
  Heart,
  Target,
  Award,
  ArrowRight,
  Star,
  CheckCircle2,
  Lightbulb,
  Handshake,
  Sparkles,
} from "lucide-react";

const coreValues = [
  {
    icon: Shield,
    title: "An toàn & Tin cậy",
    description: "Mọi đối tác đều được xác minh danh tính, kiểm tra lý lịch và có bảo hiểm đầy đủ.",
  },
  {
    icon: Lightbulb,
    title: "Đổi mới sáng tạo",
    description: "Không ngừng cải tiến công nghệ để mang đến trải nghiệm tốt nhất cho người dùng.",
  },
  {
    icon: Heart,
    title: "Tận tâm phục vụ",
    description: "Lấy sự hài lòng của khách hàng làm kim chỉ nam cho mọi hoạt động.",
  },
  {
    icon: Handshake,
    title: "Hợp tác bền vững",
    description: "Xây dựng mối quan hệ win-win giữa khách hàng, đối tác và cộng đồng.",
  },
];

const milestones = [
  { year: "2021", event: "Thành lập Otto tại TP. Hồ Chí Minh" },
  { year: "2022", event: "Đạt 10,000 đơn hàng đầu tiên, mở rộng sang Hà Nội" },
  { year: "2023", event: "Ra mắt ứng dụng mobile, đạt 50,000+ khách hàng" },
  { year: "2024", event: "Mở rộng dịch vụ tại 10 tỉnh thành, 10,000+ đối tác" },
  { year: "2025", event: "Đạt 100,000+ đơn hàng hoàn thành, rating trung bình 4.9★" },
];

// const teamMembers = [
//   {
//     name: "Nguyễn Hoàng Anh",
//     role: "CEO & Nhà sáng lập",
//     avatar: "A",
//     bio: "10 năm kinh nghiệm trong lĩnh vực công nghệ và dịch vụ tiêu dùng.",
//   },
//   {
//     name: "Trần Minh Tú",
//     role: "CTO",
//     avatar: "T",
//     bio: "Chuyên gia công nghệ với niềm đam mê xây dựng sản phẩm đột phá.",
//   },
//   {
//     name: "Lê Thanh Hà",
//     role: "COO",
//     avatar: "H",
//     bio: "Giàu kinh nghiệm vận hành và phát triển mạng lưới đối tác.",
//   },
//   {
//     name: "Phạm Quốc Bảo",
//     role: "CMO",
//     avatar: "B",
//     bio: "Chuyên gia marketing với tầm nhìn chiến lược và sáng tạo.",
//   },
// ];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-otto-cream -z-10" />
        <div className="absolute top-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-accent/10 rounded-full blur-3xl -z-10" />
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-otto-primary-light text-primary text-sm font-medium mb-6">
            <Sparkles size={16} />
            Câu chuyện của chúng tôi
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Kết nối <span className="text-gradient">triệu gia đình</span> với dịch vụ chất lượng
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Otto ra đời với sứ mệnh giúp mọi gia đình Việt Nam tiếp cận dịch vụ gia đình chuyên nghiệp một cách dễ dàng, 
            an toàn và tiết kiệm nhất.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Khách hàng tin tưởng" },
              { number: "10K+", label: "Đối tác chất lượng" },
              { number: "100K+", label: "Đơn hàng hoàn thành" },
              { number: "10+", label: "Tỉnh thành phủ sóng" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.number}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
              <div className="w-14 h-14 rounded-2xl bg-otto-primary-light flex items-center justify-center mb-6">
                <Target className="text-primary" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Sứ mệnh</h2>
              <p className="text-muted-foreground leading-relaxed">
                Xây dựng nền tảng kết nối dịch vụ gia đình hàng đầu Việt Nam, giúp mọi người tiếp cận 
                dịch vụ chất lượng cao với chi phí hợp lý. Đồng thời tạo ra cơ hội việc làm bền vững 
                cho hàng nghìn lao động trên cả nước.
              </p>
            </div>
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
              <div className="w-14 h-14 rounded-2xl bg-otto-accent-light flex items-center justify-center mb-6">
                <Award className="text-accent" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Tầm nhìn</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trở thành siêu ứng dụng dịch vụ gia đình được tin dùng nhất Đông Nam Á vào năm 2030. 
                Otto hướng đến việc số hóa toàn bộ trải nghiệm dịch vụ, từ đặt hàng, thanh toán đến 
                đánh giá chất lượng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 md:py-24 bg-otto-cream">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Giá trị cốt lõi</h2>
            <p className="text-muted-foreground">
              Bốn trụ cột định hình mọi hoạt động của Otto
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow text-center">
                <div className="w-14 h-14 rounded-2xl bg-otto-primary-light flex items-center justify-center mx-auto mb-4">
                  <item.icon className="text-primary" size={26} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      {/* <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Hành trình phát triển</h2>
            <p className="text-muted-foreground">Những cột mốc quan trọng của Otto</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2" />
            <div className="space-y-8">
              {milestones.map((item, i) => (
                <div key={i} className={`relative flex items-start gap-6 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className="hidden md:block md:w-1/2" />
                  <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background -translate-x-1/2 mt-1.5 z-10" />
                  <div className="ml-14 md:ml-0 md:w-1/2 bg-card rounded-2xl p-5 shadow-card border border-border">
                    <span className="text-sm font-bold text-gradient">{item.year}</span>
                    <p className="text-foreground mt-1">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section> */}

      {/* Team */}
      {/* <section className="py-16 md:py-24 bg-otto-cream">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Đội ngũ lãnh đạo</h2>
            <p className="text-muted-foreground">
              Những người đứng sau sứ mệnh kết nối triệu gia đình
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-hero flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-foreground">{member.avatar}</span>
                </div>
                <h3 className="font-semibold text-foreground text-lg">{member.name}</h3>
                <p className="text-sm text-primary font-medium mb-2">{member.role}</p>
                <p className="text-sm text-muted-foreground">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Why Choose */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Tại sao chọn Otto?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: CheckCircle2, title: "100% Đối tác xác minh", desc: "Kiểm tra lý lịch, bằng cấp và kinh nghiệm trước khi chấp nhận." },
              { icon: Award, title: "Đào tạo chuyên nghiệp", desc: "Mọi đối tác đều trải qua chương trình đào tạo kỹ năng bài bản." },
              { icon: Shield, title: "Bảo hiểm toàn diện", desc: "Bảo hiểm cho cả khách hàng và đối tác trong suốt quá trình dịch vụ." },
              { icon: Star, title: "Đánh giá minh bạch", desc: "Hệ thống đánh giá công khai giúp bạn chọn đối tác phù hợp nhất." },
              { icon: Clock, title: "Hỗ trợ 24/7", desc: "Đội ngũ chăm sóc khách hàng sẵn sàng hỗ trợ mọi lúc mọi nơi." },
              { icon: Users, title: "Cộng đồng lớn mạnh", desc: "Hơn 50,000 khách hàng và 10,000 đối tác trên toàn quốc." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl bg-card shadow-card border border-border">
                <div className="w-12 h-12 rounded-xl bg-otto-primary-light flex items-center justify-center shrink-0">
                  <item.icon className="text-primary" size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trở thành một phần của Otto
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Dù bạn là khách hàng hay chuyên gia dịch vụ, Otto luôn chào đón bạn!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book-service" className="w-full sm:w-auto">
                <Button size="xl" asChild className="bg-background text-primary hover:bg-background/90 w-full">
                  <span>
                    Đặt dịch vụ ngay
                    <ArrowRight className="ml-2" size={20} />
                  </span>
                </Button>
              </Link>
              <Link href="/tasker-register" className="w-full sm:w-auto">
                <Button size="xl" variant="hero-outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 w-full">
                  <span>
                    Trở thành đối tác
                    <ArrowRight className="ml-2" size={20} />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
