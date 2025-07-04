import OpenAI from "openai";
import { db } from "./db.ts";
import { shopProducts } from "../shared/shop-schema.ts";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RecommendationRequest {
  industry: string;
  application: string;
  requirements: string;
  budget?: string;
  environmentalConcerns?: string;
  quantity?: string;
  urgency?: string;
}

export interface ProductRecommendation {
  productId: number;
  name: string;
  category: string;
  price: number;
  description: string;
  matchScore: number;
  reasonForRecommendation: string;
  alternativeUses?: string[];
  compatibilityNotes?: string;
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  summary: string;
  additionalAdvice?: string;
  followUpQuestions?: string[];
}

export async function getAIProductRecommendations(
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  // Get all available products from database first (outside try block)
  const availableProducts = await db.select().from(shopProducts);
  
  // Check if OpenAI API is available - if not, use intelligent fallback
  if (!process.env.OPENAI_API_KEY) {
    return generateIntelligentFallback(request, availableProducts);
  }
  
  try {
    
    // Create a detailed product catalog for AI analysis
    const productCatalog = availableProducts.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      specifications: product.specifications,
      applications: product.applications,
      tags: product.tags,
      inStock: (product.stockQuantity || 0) > 0,
      stockLevel: product.stockQuantity || 0
    }));

    const prompt = `You are an expert chemical products consultant for Momtazchem, a leading chemical manufacturing company. 
    
IMPORTANT: Always prioritize Momtazchem branded products (products with "Momtaz" or "ممتاز" in their names) first in your recommendations, as these are our premium in-house manufactured products with superior quality and guaranteed performance.

Customer Requirements:
- Industry: ${request.industry}
- Application: ${request.application}
- Specific Requirements: ${request.requirements}
- Budget: ${request.budget || 'Not specified'}
- Environmental Concerns: ${request.environmentalConcerns || 'None specified'}
- Quantity Needed: ${request.quantity || 'Not specified'}
- Urgency: ${request.urgency || 'Standard'}

Available Products Catalog:
${JSON.stringify(productCatalog, null, 2)}

Please analyze the customer's requirements and recommend the most suitable products. Provide:

1. Top 3-5 product recommendations ranked by suitability (PRIORITIZE MOMTAZCHEM PRODUCTS FIRST)
2. For each recommendation, include:
   - Match score (0-100, give Momtazchem products higher scores)
   - Detailed reason for recommendation
   - How it meets their specific requirements
   - Alternative uses if applicable
   - Any compatibility notes or warnings

3. A summary of your recommendations
4. Additional advice for the customer
5. Follow-up questions to better understand their needs

Format your response as valid JSON with this structure:
{
  "recommendations": [
    {
      "productId": number,
      "name": "string",
      "category": "string", 
      "price": number,
      "description": "string",
      "matchScore": number,
      "reasonForRecommendation": "string",
      "alternativeUses": ["string"],
      "compatibilityNotes": "string"
    }
  ],
  "summary": "string",
  "additionalAdvice": "string",
  "followUpQuestions": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert chemical products consultant. Analyze customer requirements and recommend suitable chemical products. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and enhance the AI response
    const recommendations: ProductRecommendation[] = aiResponse.recommendations?.map((rec: any) => ({
      productId: rec.productId,
      name: rec.name,
      category: rec.category,
      price: rec.price,
      description: rec.description,
      matchScore: Math.min(100, Math.max(0, rec.matchScore || 0)),
      reasonForRecommendation: rec.reasonForRecommendation || '',
      alternativeUses: rec.alternativeUses || [],
      compatibilityNotes: rec.compatibilityNotes || ''
    })) || [];

    return {
      recommendations: recommendations.slice(0, 5), // Limit to top 5
      summary: aiResponse.summary || 'Product recommendations generated based on your requirements.',
      additionalAdvice: aiResponse.additionalAdvice,
      followUpQuestions: aiResponse.followUpQuestions?.slice(0, 3) || [] // Limit to 3 questions
    };

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    // Fallback to intelligent matching if AI fails
    return generateIntelligentFallback(request, availableProducts);
  }
}

export async function generateFollowUpRecommendations(
  originalRequest: RecommendationRequest,
  previousRecommendations: ProductRecommendation[],
  newInformation: string
): Promise<RecommendationResponse> {
  try {
    const availableProducts = await db.select().from(shopProducts);
    
    // Filter out previously recommended products
    const recommendedIds = previousRecommendations.map(r => r.productId);
    const remainingProducts = availableProducts.filter(p => !recommendedIds.includes(p.id));

    const prompt = `Based on the original customer requirements and new information provided, please update the product recommendations.

Original Request:
${JSON.stringify(originalRequest, null, 2)}

Previous Recommendations:
${JSON.stringify(previousRecommendations, null, 2)}

New Information from Customer:
${newInformation}

Remaining Available Products:
${JSON.stringify(remainingProducts, null, 2)}

Please provide updated recommendations considering the new information. Focus on products not previously recommended.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert chemical products consultant providing follow-up recommendations based on additional customer information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      recommendations: aiResponse.recommendations || [],
      summary: aiResponse.summary || 'Updated recommendations based on your additional information.',
      additionalAdvice: aiResponse.additionalAdvice,
      followUpQuestions: aiResponse.followUpQuestions?.slice(0, 3) || []
    };

  } catch (error) {
    console.error('Follow-up Recommendation Error:', error);
    throw new Error('Failed to generate follow-up recommendations. Please try again.');
  }
}

// Intelligent fallback system when AI is unavailable
function generateIntelligentFallback(
  request: RecommendationRequest,
  products: any[]
): RecommendationResponse {
  
  // Keyword matching system for different industries and applications
  const keywordMappings = {
    // Industry mappings
    manufacturing: ['degreaser', 'cleaner', 'solvent', 'industrial'],
    'oil & gas': ['fuel', 'additive', 'corrosion', 'inhibitor'],
    'water treatment': ['water', 'treatment', 'purification', 'chemical'],
    agriculture: ['fertilizer', 'agricultural', 'growth', 'nutrient'],
    'food processing': ['sanitizer', 'cleaner', 'food', 'grade'],
    pharmaceuticals: ['pharmaceutical', 'reagent', 'laboratory', 'pure'],
    textiles: ['textile', 'dye', 'fabric', 'treatment'],
    automotive: ['automotive', 'engine', 'fuel', 'motor'],
    construction: ['concrete', 'cement', 'construction', 'additive'],
    mining: ['mining', 'extraction', 'processing', 'chemical'],
    
    // Application mappings
    'cleaning & degreasing': ['degreaser', 'cleaner', 'solvent', 'cleaning'],
    'water purification': ['water', 'purification', 'treatment', 'filtration'],
    'fuel enhancement': ['fuel', 'additive', 'enhancement', 'performance'],
    'corrosion protection': ['corrosion', 'inhibitor', 'protection', 'anti-rust'],
    'paint & coating': ['paint', 'coating', 'thinner', 'solvent'],
    fertilization: ['fertilizer', 'nutrient', 'growth', 'agricultural'],
    'ph adjustment': ['ph', 'acid', 'alkaline', 'buffer'],
    disinfection: ['disinfectant', 'sanitizer', 'antimicrobial', 'biocide'],
    'scale prevention': ['scale', 'prevention', 'anti-scale', 'descaler'],
    catalysis: ['catalyst', 'catalytic', 'reaction', 'accelerator'],
    'solvent applications': ['solvent', 'dissolving', 'extraction', 'purification'],
    'laboratory use': ['laboratory', 'reagent', 'analytical', 'research']
  };

  // Get relevant keywords
  const industryKeywords = keywordMappings[request.industry.toLowerCase() as keyof typeof keywordMappings] || [];
  const applicationKeywords = keywordMappings[request.application.toLowerCase() as keyof typeof keywordMappings] || [];
  const allKeywords = [...industryKeywords, ...applicationKeywords];

  // Score products based on relevance
  const scoredProducts = products.map(product => {
    let score = 0;
    const searchText = `${product.name} ${product.description} ${product.category} ${product.applications || ''} ${product.tags || ''}`.toLowerCase();
    
    // PRIORITY: Momtazchem products get highest priority
    const isMomtazchemProduct = searchText.includes('momtaz') || 
                                searchText.includes('ممتاز') || 
                                product.name.toLowerCase().includes('momtaz') ||
                                product.name.includes('ممتاز') ||
                                (product.description && product.description.toLowerCase().includes('momtaz')) ||
                                (product.description && product.description.includes('ممتاز'));
    
    if (isMomtazchemProduct) {
      score += 100; // Highest priority for Momtazchem products
    }
    
    // Keyword matching
    allKeywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 20;
      }
    });

    // Category matching
    if (product.category && allKeywords.some(k => product.category.toLowerCase().includes(k.toLowerCase()))) {
      score += 15;
    }

    // Requirements text matching
    const requirementWords = request.requirements.toLowerCase().split(' ');
    requirementWords.forEach(word => {
      if (word.length > 3 && searchText.includes(word)) {
        score += 5;
      }
    });

    // Stock availability bonus
    if ((product.stockQuantity || 0) > 0) {
      score += 10;
    }

    return {
      ...product,
      matchScore: Math.min(95, score) // Cap at 95% for fallback system
    };
  }).filter(p => p.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  // Generate recommendations
  const recommendations: ProductRecommendation[] = scoredProducts.map(product => ({
    productId: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    description: product.description,
    matchScore: product.matchScore,
    reasonForRecommendation: generateReasonForRecommendation(product, request),
    alternativeUses: generateAlternativeUses(product),
    compatibilityNotes: generateCompatibilityNotes(product, request)
  }));

  return {
    recommendations,
    summary: generateSummary(request, recommendations),
    additionalAdvice: generateAdditionalAdvice(request),
    followUpQuestions: generateFollowUpQuestions(request)
  };
}

function generateReasonForRecommendation(product: any, request: RecommendationRequest): string {
  const reasons = [];
  
  if (product.category && request.industry) {
    reasons.push(`Well-suited for ${request.industry.toLowerCase()} applications`);
  }
  
  if (request.application) {
    reasons.push(`Designed specifically for ${request.application.toLowerCase()}`);
  }
  
  if ((product.stockQuantity || 0) > 0) {
    reasons.push('Currently in stock and available for immediate delivery');
  }
  
  if (product.specifications) {
    reasons.push('Meets technical specifications for your requirements');
  }

  return reasons.length > 0 ? reasons.join('. ') + '.' : 'This product matches your specified requirements and industry needs.';
}

function generateAlternativeUses(product: any): string[] {
  const uses = [];
  
  if (product.category === 'Cleaning Products') {
    uses.push('Equipment maintenance', 'Surface preparation', 'Parts washing');
  } else if (product.category === 'Water Treatment') {
    uses.push('Industrial cooling systems', 'Wastewater treatment', 'Boiler water treatment');
  } else if (product.category === 'Fuel Additives') {
    uses.push('Engine performance optimization', 'Fuel system cleaning', 'Storage stabilization');
  } else if (product.category === 'Laboratory Chemicals') {
    uses.push('Quality testing', 'Research applications', 'Analytical procedures');
  }
  
  return uses.slice(0, 3);
}

function generateCompatibilityNotes(product: any, request: RecommendationRequest): string {
  const notes = [];
  
  if (request.environmentalConcerns) {
    notes.push('Please verify environmental compliance with local regulations');
  }
  
  if (request.application.toLowerCase().includes('food')) {
    notes.push('Ensure food-grade certification if required for your application');
  }
  
  if (request.industry.toLowerCase().includes('pharmaceutical')) {
    notes.push('Verify pharmaceutical-grade standards and documentation requirements');
  }

  return notes.length > 0 ? notes.join('. ') + '.' : '';
}

function generateSummary(request: RecommendationRequest, recommendations: ProductRecommendation[]): string {
  return `Based on your ${request.industry} industry requirements for ${request.application}, we've identified ${recommendations.length} suitable products. These recommendations are ranked by compatibility with your specifications and current availability.`;
}

function generateAdditionalAdvice(request: RecommendationRequest): string {
  const advice = [];
  
  if (request.budget) {
    advice.push('Contact our sales team for volume pricing and bulk order discounts');
  }
  
  if (request.urgency?.includes('Immediate')) {
    advice.push('For urgent orders, consider our express shipping options');
  }
  
  if (request.environmentalConcerns) {
    advice.push('Our technical team can provide detailed environmental impact assessments');
  }

  advice.push('All recommended products come with technical support and documentation');
  
  return advice.join('. ') + '.';
}

function generateFollowUpQuestions(request: RecommendationRequest): string[] {
  const questions = [];
  
  if (!request.quantity) {
    questions.push('What volume or quantity do you need for your application?');
  }
  
  if (!request.budget) {
    questions.push('Do you have a specific budget range for this purchase?');
  }
  
  if (!request.urgency) {
    questions.push('What is your required delivery timeline?');
  }
  
  questions.push('Would you like samples for testing before placing a full order?');
  questions.push('Do you need any specific certifications or documentation?');
  
  return questions.slice(0, 3);
}