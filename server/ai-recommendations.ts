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
  try {
    // Get all available products from database
    const availableProducts = await db.select().from(shopProducts);
    
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

1. Top 3-5 product recommendations ranked by suitability
2. For each recommendation, include:
   - Match score (0-100)
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
    throw new Error('Failed to generate AI recommendations. Please try again.');
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