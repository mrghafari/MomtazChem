import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductData {
  name: string;
  category: string;
  description?: string;
  specifications?: any;
  features?: any;
  applications?: any;
  unitPrice?: string;
  stockUnit?: string;
  supplier?: string;
  variantType?: string;
  variantValue?: string;
}

export interface SKUGenerationResult {
  sku: string;
  reasoning: string;
  categoryCode: string;
  productCode: string;
  variantCode?: string;
}

export async function generateSmartSKU(productData: ProductData): Promise<SKUGenerationResult> {
  try {
    const prompt = `
You are an expert in creating SKU (Stock Keeping Unit) codes for chemical products. Generate a smart, professional SKU based on the following product information:

Product Details:
- Name: ${productData.name}
- Category: ${productData.category}
- Description: ${productData.description || 'N/A'}
- Specifications: ${JSON.stringify(productData.specifications || {})}
- Features: ${JSON.stringify(productData.features || [])}
- Applications: ${JSON.stringify(productData.applications || [])}
- Unit Price: ${productData.unitPrice || 'N/A'}
- Stock Unit: ${productData.stockUnit || 'N/A'}
- Supplier: ${productData.supplier || 'N/A'}
- Variant Type: ${productData.variantType || 'N/A'}
- Variant Value: ${productData.variantValue || 'N/A'}

SKU Requirements:
1. Length: 8-12 characters
2. Format: [CATEGORY-CODE][PRODUCT-CODE][VARIANT-CODE if applicable]
3. Use abbreviations for chemical categories:
   - fuel-additives → FA
   - water-treatment → WT
   - paint-thinner → PT
   - agricultural-fertilizers → AF
   - other-products → OP
4. Extract key characteristics from name/specifications
5. Include variant information if product is a variant
6. Make it human-readable but concise
7. Avoid special characters except hyphens
8. Use uppercase letters and numbers

Example SKUs:
- FA-DIS-5L (Fuel Additive Dispersant 5 Liter)
- WT-CLR-25K (Water Treatment Clarifier 25kg)
- PT-THN-PRO (Paint Thinner Professional)

Please respond with JSON in this exact format:
{
  "sku": "GENERATED_SKU_CODE",
  "reasoning": "Explanation of why this SKU was chosen",
  "categoryCode": "Category abbreviation used",
  "productCode": "Product-specific code used",
  "variantCode": "Variant code if applicable (or empty string)"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SKU generator for chemical products. Generate professional, logical SKU codes based on product characteristics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      sku: result.sku || `AUTO-${Date.now()}`,
      reasoning: result.reasoning || "Generated automatically",
      categoryCode: result.categoryCode || "GEN",
      productCode: result.productCode || "AUTO",
      variantCode: result.variantCode || ""
    };

  } catch (error) {
    console.error("Error generating SKU with AI:", error);
    
    // Fallback SKU generation if AI fails
    const categoryMap: { [key: string]: string } = {
      'fuel-additives': 'FA',
      'water-treatment': 'WT', 
      'paint-thinner': 'PT',
      'agricultural-fertilizers': 'AF',
      'other-products': 'OP'
    };

    const categoryCode = categoryMap[productData.category] || 'GEN';
    const productCode = productData.name.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const variantCode = productData.variantValue ? `-${productData.variantValue.substring(0, 2).toUpperCase()}` : '';
    const fallbackSKU = `${categoryCode}-${productCode}${variantCode}-${Date.now().toString().slice(-4)}`;

    return {
      sku: fallbackSKU,
      reasoning: "Generated using fallback method due to AI service unavailability",
      categoryCode,
      productCode,
      variantCode
    };
  }
}

export async function validateSKUUniqueness(sku: string): Promise<boolean> {
  // This will be implemented to check database for SKU uniqueness
  // For now, return true (assuming unique)
  return true;
}