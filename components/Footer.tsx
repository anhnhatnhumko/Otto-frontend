import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-hero">
                <span className="text-xl font-bold text-primary-foreground">O</span>
              </div>
              <span className="text-2xl font-bold">Otto</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Nền tảng đặt dịch vụ gia đình hàng đầu Việt Nam. Kết nối bạn với các chuyên gia đáng tin cậy.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Dịch vụ</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link href="/book-service" className="hover:text-primary transition-colors">Dọn dẹp nhà cửa</Link></li>
              <li><Link href="/book-service" className="hover:text-primary transition-colors">Giặt ủi</Link></li>
              <li><Link href="/book-service" className="hover:text-primary transition-colors">Sửa chữa điện nước</Link></li>
              <li><Link href="/book-service" className="hover:text-primary transition-colors">Chăm sóc người già</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Công ty</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Đối tác</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Điều khoản dịch vụ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                <span>support@otto.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-primary mt-0.5" />
                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center text-sm text-background/50">
          <p>© 2024 Otto. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
