import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Logo and Description */}
          <div className="flex flex-col items-start space-y-4">
            <Logo className="text-primary-foreground" width={220} height={56} />
            <p className="text-sm text-primary-foreground/80 max-w-xs">
              Türkiye'nin en kapsamlı teşvik ve yatırım destek platformu. Yatırımlarınız için en uygun teşvikleri
              kolayca bulun.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-semibold text-lg mb-2">Hızlı Erişim</h3>
            <Link
              to="/searchsupport"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Destek Arama
            </Link>
            <Link
              to="/incentive-tools"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Teşvik Hesaplama
            </Link>
            <Link
              to="/yatirim-firsatlari"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Yatırım Fırsatları
            </Link>
            <Link
              to="/qna"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Soru & Cevap
            </Link>
            <Link
              to="/mevzuat"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Mevzuat
            </Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-semibold text-lg mb-2">İletişim</h3>
            <div className="flex items-start space-x-3 text-sm text-primary-foreground/80">
              <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>info@yatirimadestek.gov.tr</span>
            </div>
            <div className="flex items-start space-x-3 text-sm text-primary-foreground/80">
              <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>+90 (XXX) XXX XX XX</span>
            </div>
            <div className="flex items-start space-x-3 text-sm text-primary-foreground/80">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Ankara, Türkiye</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-primary-foreground/60">
              © {currentYear} yatirimadestek.gov.tr. Tüm hakları saklıdır.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/gizlilik"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Gizlilik Politikası
              </Link>
              <Link
                to="/kullanim-kosullari"
                className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Kullanım Koşulları
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
