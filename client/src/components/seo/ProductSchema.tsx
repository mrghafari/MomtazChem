import { useEffect } from 'react';

interface ProductSchemaProps {
  product: {
    id: number;
    name: string;
    description?: string;
    price?: string;
    currency?: string;
    imageUrl?: string;
    sku?: string;
    barcode?: string;
    inStock?: boolean;
    stockQuantity?: number;
    category?: string;
    priceUnit?: string;
  };
  rating?: {
    averageRating: number;
    totalReviews: number;
  };
}

export default function ProductSchema({ product, rating }: ProductSchemaProps) {
  useEffect(() => {
    const schema: any = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "description": product.description || `${product.name} - Premium quality chemical product by Momtazchem`,
      "image": product.imageUrl || "https://momtazchem.com/default-product.jpg",
      "sku": product.sku || product.barcode || `MTZCHEM-${product.id}`,
      "mpn": product.barcode || product.sku,
      "brand": {
        "@type": "Brand",
        "name": "Momtazchem"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://momtazchem.com/product-reviews/${product.id}`,
        "priceCurrency": product.currency || "IQD",
        "price": product.price && !isNaN(parseFloat(product.price)) ? parseFloat(product.price).toFixed(2) : "0.00",
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        "availability": product.inStock && (product.stockQuantity || 0) > 0 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "Organization",
          "name": "Momtazchem Chemical Solutions"
        }
      }
    };

    // Add aggregateRating if available
    if (rating && rating.totalReviews > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": rating.averageRating.toFixed(1),
        "reviewCount": rating.totalReviews,
        "bestRating": "5",
        "worstRating": "1"
      };
    }

    // Add category if available
    if (product.category) {
      schema.category = product.category;
    }

    // Add additional properties
    if (product.priceUnit) {
      schema.additionalProperty = [{
        "@type": "PropertyValue",
        "name": "Unit",
        "value": product.priceUnit
      }];
    }

    // Create or update script tag
    const scriptId = 'product-schema';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    
    script.textContent = JSON.stringify(schema, null, 2);

    // Cleanup
    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [product, rating]);

  return null;
}
