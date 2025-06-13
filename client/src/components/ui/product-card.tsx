import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import MolecularHoverEffect from "./molecular-hover-effect";

interface ProductCardProps {
  title: string;
  description: string;
  features: string[];
  imageUrl: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  moleculeType?: 'benzene' | 'water' | 'ethanol' | 'methane' | 'ammonia';
}

const ProductCard = ({ title, description, features, imageUrl, href, icon, iconBg, moleculeType = 'benzene' }: ProductCardProps) => {
  return (
    <MolecularHoverEffect moleculeType={moleculeType} className="h-full">
      <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-glow transition-all duration-500 overflow-hidden group h-full">
        <div
          className="h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 relative"
          style={{ backgroundImage: `url(${imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/30 transition-all duration-500" />
        </div>
        <CardContent className="p-8">
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4 group-hover:shadow-glow transition-all duration-500`}>
              {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">{description}</p>
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                <Check className="h-4 w-4 text-secondary mr-3 group-hover:text-blue-500 transition-colors duration-300" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href={href}>
            <button className="text-primary font-semibold hover:text-blue-700 transition-all duration-300 flex items-center group-hover:bg-blue-50 px-4 py-2 rounded-lg -mx-4">
              Learn More <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </Link>
        </CardContent>
      </Card>
    </MolecularHoverEffect>
  );
};

export default ProductCard;
