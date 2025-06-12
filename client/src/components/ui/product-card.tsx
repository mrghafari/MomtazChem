import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";

interface ProductCardProps {
  title: string;
  description: string;
  features: string[];
  imageUrl: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}

const ProductCard = ({ title, description, features, imageUrl, href, icon, iconBg }: ProductCardProps) => {
  return (
    <Card className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
      <div
        className="h-64 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <CardContent className="p-8">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4`}>
            {icon}
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <Check className="h-4 w-4 text-secondary mr-3" />
              {feature}
            </li>
          ))}
        </ul>
        <Link href={href}>
          <button className="text-primary font-semibold hover:text-primary-dark transition-colors duration-200 flex items-center">
            Learn More <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
