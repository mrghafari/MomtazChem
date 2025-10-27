import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FlaskRound, Phone, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import company_logo_png from "@assets/company-logo.png.jpg";

const HeroSection = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(21, 101, 192, 0.7), rgba(46, 125, 50, 0.5)), url('/attached_assets/hero_background_1749877550777.png')`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {t.advancedChemical}{" "}
            <span className="text-yellow-400">{t.solutions}</span> {t.forIndustry}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100 leading-relaxed">
            {t.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products/fuel-additives">
              <Button
                size="lg"
                className="bg-accent-orange hover:bg-accent-orange-dark text-white text-lg font-semibold"
              >
                <FlaskRound className="mr-3 h-5 w-5" />
                {t.exploreProducts}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md px-8 border-2 border-white text-white hover:bg-white hover:text-primary text-lg font-semibold bg-[#0079f2]"
                src={company_logo_png}>
                <Phone className="mr-3 h-5 w-5" />
                {t.contactSales}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <ChevronDown className="h-8 w-8" />
      </div>
    </section>
  );
};

export default HeroSection;
