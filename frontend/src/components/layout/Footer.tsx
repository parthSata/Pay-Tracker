import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface FooterProps {
  footerText?: string;
}

export function Footer({ footerText }: FooterProps = {}) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border/60 bg-card/30 backdrop-blur-md px-6 py-4 flex flex-col items-center gap-4 text-xs text-muted-foreground transition-all duration-300 rounded-2xl shadow-sm w-full">
      {footerText && (
        <div className="w-full text-center text-muted-foreground/85 border-b border-border/50 pb-3 mb-1 font-medium leading-relaxed max-w-2xl mx-auto">
          {footerText}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-1.5">
          <span>{t("footer_copyright", { year: currentYear })}</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/terms" className="hover:text-foreground transition-colors duration-200">
            {t("footer_terms")}
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors duration-200">
            {t("footer_privacy")}
          </Link>
          <Link to="/support" className="hover:text-foreground transition-colors duration-200">
            {t("footer_support")}
          </Link>
          <span className="hidden sm:inline text-border/60">|</span>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 fill-destructive text-destructive animate-pulse" />
            <span>for creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
